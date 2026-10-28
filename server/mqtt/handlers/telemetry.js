import { getBinByMacAndKeyShared, getOrgDeviceSettingsShared } from "../../db/service/sharedService.js";
import { appendFilter, checkPayloadFields } from "../../utils/helpers.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { binLogModel, deviceDiagnosticModel } from "../../db/models/models.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";
import { fromDeviceLocation } from "../../utils/geo.js";
import { fullnessPercent } from "../../utils/analytics.js";
import { settleClaims } from "../../db/service/routeService.js";
import { binFillRate } from "../../db/service/fillRateService.js";
import { organizationThresholds } from "../../db/service/thresholdService.js";
import { batteryLevel, fullnessLevel } from "../../utils/thresholds.js";
import { cleanDiagnostics } from "../../utils/diagnostics.js";
import {
    MAX_ABS_CLOCK_ERROR_SECONDS, MAX_ABS_DRIFT_PPM,
} from "../../utils/constants.js";

export function isValidTelemetryRecord({
    location,
    health,
    level,
    sensorOk,
    battery,
    weight,
    message,
    lastAwakeSeconds,
}, kind = "bin") {
    return checkPayloadFields({
        location,
        health,
        level,
        sensorOk,
        battery,
        weight,
        message,
        lastAwakeSeconds,
    }, { hasFillSensor: kind !== "gateway" });
}

const SCALE_STATES = ["ok", "uncalibrated", "failed"];

// Optional sleep-clock diagnostics. An invalid value is dropped instead of
// rejecting the report, so a diagnostic field can never cost a reading.
function clockDiagnostics({ driftPpm, clockErrorSeconds }) {
    const within = (value, limit) => Number.isInteger(value) && Math.abs(value) <= limit;
    return {
        ...(within(driftPpm, MAX_ABS_DRIFT_PPM) ? { driftPpm } : {}),
        ...(within(clockErrorSeconds, MAX_ABS_CLOCK_ERROR_SECONDS) ? { clockErrorSeconds } : {}),
    };
}

// Whether a reading taken at this time is newer than every reading logged for the bin.
async function isNewestReading(binId, measuredAt) {
    const latest = await binLogModel.findOne({ binId }, { createdAt: 1 }).sort({ createdAt: -1 }).lean();
    return !latest || measuredAt >= latest.createdAt;
}

// Stores one validated telemetry record for an authenticated bin, whether it
// arrived over the bin's own cellular link or was relayed by a mesh gateway.
// The record's location is [lng, lat] (the callers turn the device's around).
// measuredAt is when a relayed reading was taken; without it the reading is
// from now. A reading is logged at that time, and only the newest one sets the
// bin's status, so readings a leaf queued land in place, in any order.
// Returns the bin's next report schedule at the organization's interval (a
// relayed leaf follows its gateway's beacons instead, so only its time zone is used).
export async function applyDeviceLog(bin, {
    location,
    health,
    level,
    sensorOk,
    battery,
    weight,
    message: healthMessage,
    lastAwakeSeconds,
    driftPpm,
    clockErrorSeconds,
    scale,
    diagnostics: rawDiagnostics,
}, { via, gatewayId = null, hops = null, rssi = null, measuredAt, reportIntervalMinutes, reportStartHour }) {
    const schedule = getNextReportSchedule(location, reportIntervalMinutes, reportStartHour);
    const takenAt = measuredAt ?? new Date();
    const isNewest = measuredAt === undefined || await isNewestReading(bin._id, measuredAt);
    // A gateway has no fill sensor: a level it sends is ignored, and its level
    // fields stay untouched so it never reads as a bin with a failed sensor.
    const isGateway = bin.kind === "gateway";
    if (isGateway) {
        level = undefined;
    }

    // The device sends grams. A weight counts only from a calibrated scale that
    // read fine; otherwise (or with no scale at all) it is null, not 0.
    const scaleState = SCALE_STATES.includes(scale) ? scale : null;
    const weightKg = scaleState === "ok" ? Math.max(weight, 0) / 1000 : null;

    // Severity follows fullness (fill level or weight, whichever is higher)
    // and the battery against the organization's cut-offs, as the map and the
    // dashboard do; a gateway has no fullness.
    const thresholds = await organizationThresholds(bin.ownerId);
    const fullness = fullnessPercent(sensorOk !== false ? level : null, weightKg);
    const fullnessState = fullnessLevel(fullness, thresholds);
    const batteryState = batteryLevel(battery, thresholds);
    const severity = fullnessState === 'critical' || batteryState === 'critical' || health === 'critical'
        ? 'critical'
        : fullnessState === 'warning' || batteryState === 'warning' || health === 'warning'
            ? 'warning'
            : 'info';
    const messages = [];
    if (fullnessState === 'critical') messages.push('Bin is almost full.');
    else if (fullnessState === 'warning') messages.push('Bin is filling up.');
    if (batteryState === 'critical') messages.push('Battery level is critical.');
    else if (batteryState === 'warning') messages.push('Battery level is low.');
    if (healthMessage) messages.push(healthMessage);
    const message = messages.length > 0 ? messages.join(' ') : null;

    // Whatever the device sent about itself that checks out (see utils/diagnostics.js).
    const diagnostics = cleanDiagnostics(rawDiagnostics);
    const levelIsValid = !isGateway && sensorOk !== false;
    let query = {
        binId: bin._id,
        location,
        health,
        oldLevel: isGateway ? null : bin.status.level,
        newLevel: levelIsValid ? level : null,
        battery,
        ...(lastAwakeSeconds === undefined ? {} : { lastAwakeSeconds }),
        ...clockDiagnostics({ driftPpm, clockErrorSeconds }),
        connection: via,
        ...(gatewayId === null ? {} : { gatewayId }),
        ...(hops === null ? {} : { hops }),
        ...(rssi === null ? {} : { rssi }),
        severity,
        type: 'log',
        source: 'sensor',
        weight: weightKg,
        createdAt: takenAt,
    };
    query = appendFilter(query, message, 'message', message);

    const log = await binLogModel.create(query);
    // Kept apart, for a shorter time than the log; never at the cost of the report.
    if (diagnostics) {
        try {
            await deviceDiagnosticModel.create({ binId: bin._id, logId: log._id, createdAt: takenAt, diagnostics });
        } catch (error) {
            console.error(`Could not store the diagnostics of ${bin.binName}:`, error?.message ?? error);
        }
    }
    // A collection a driver marked on this bin is confirmed or contradicted by
    // its next report; never at the cost of storing the report.
    if (!isGateway) {
        try {
            await settleClaims(bin._id, { at: takenAt, level: levelIsValid ? level : null, weight: weightKg, logId: log._id });
        } catch (error) {
            console.error(`Could not settle the route claims of ${bin.binName}:`, error?.message ?? error);
        }
    }
    if (!isNewest) {
        return schedule;
    }
    // How fast it fills, with this report; a failure leaves it stale, to be
    // worked out when next read.
    if (!isGateway) {
        try {
            bin.status.fillRatePerDay = await binFillRate(bin._id);
            bin.status.fillRateAt = new Date();
        } catch (error) {
            console.error(`Could not work out the fill rate of ${bin.binName}:`, error?.message ?? error);
        }
    }

    bin.status.updatedAt = takenAt;
    // The latest diagnostics stay on the bin; firmware without them leaves the last ones.
    if (diagnostics) {
        bin.status.diagnostics = diagnostics;
        if (diagnostics.firmwareVersion) bin.status.firmwareVersion = diagnostics.firmwareVersion;
    }
    bin.status.health = health;
    bin.status.healthMessage = healthMessage || "";
    if (!isGateway) {
        bin.status.levelValid = levelIsValid;
        if (levelIsValid) {
            bin.status.level = level;
        }
    }
    bin.status.battery = battery;
    if (lastAwakeSeconds !== undefined) {
        bin.status.lastAwakeSeconds = lastAwakeSeconds;
    }
    bin.status.weight = weightKg;
    bin.status.scale = scaleState;
    bin.status.connection = { via, gatewayId, hops, rssi };
    bin.location.coordinates = location;
    bin.timezone = schedule.timeZone;
    if (message) {
        bin.maintenance.notes = `Last updated via MQTT on ${new Date().toLocaleString()}, message: ${message}`;
    }
    await bin.save();
    return schedule;
}

export async function handleDeviceLog(mac, { deviceKey, ...record }) {
    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) return;
    // Validated after the lookup: whether a level is required depends on kind.
    if (!isValidTelemetryRecord(record, bin.kind)) return;
    const {
        meshAwakeWindowSeconds: orgMeshAwakeWindowSeconds,
        reportIntervalMinutes,
        reportStartHour,
    } = await getOrgDeviceSettingsShared(bin.ownerId);
    const {
        timeZone,
        nextWakeEpoch,
        followingWakeEpoch,
        sleepDurationSeconds: scheduledSleepDurationSeconds,
    } = await applyDeviceLog(bin, { ...record, location: fromDeviceLocation(record.location) },
        { via: "cellular", reportIntervalMinutes, reportStartHour });

    console.log("Updated log for", mac);
    mqttClient.publish(
        `${BIN_ACK_TOPIC}/${mac}`,
        JSON.stringify({
            status: "Log updated",
            mac,
            timeZone,
            nextWakeEpoch,
            followingWakeEpoch,
            sleepDurationSeconds: scheduledSleepDurationSeconds,
            meshAwakeWindowSeconds: orgMeshAwakeWindowSeconds,
        })
    );
}
