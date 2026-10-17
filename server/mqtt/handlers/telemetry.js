import { getBinByMacAndKeyShared, getOrgDeviceSettingsShared } from "../../db/service/sharedService.js";
import { appendFilter, checkPayloadFields } from "../../utils/helpers.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { binLogModel } from "../../db/models/models.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";

export function isValidTelemetryRecord({
    location,
    health,
    level,
    sensorOk,
    battery,
    weight,
    message,
    sleepDurationSeconds,
    meshAwakeWindowSeconds,
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
        sleepDurationSeconds,
        meshAwakeWindowSeconds,
        lastAwakeSeconds,
    }, { hasFillSensor: kind !== "gateway" });
}

// Optional sleep-clock diagnostics. An invalid value is dropped instead of
// rejecting the report, so a diagnostic field can never cost a reading.
function clockDiagnostics({ driftPpm, clockErrorSeconds, wakeOffsetSeconds }) {
    const within = (value, limit) => Number.isInteger(value) && Math.abs(value) <= limit;
    return {
        ...(within(driftPpm, 100000) ? { driftPpm } : {}),
        ...(within(clockErrorSeconds, 86400) ? { clockErrorSeconds } : {}),
        ...(within(wakeOffsetSeconds, 3600) ? { wakeOffsetSeconds } : {}),
    };
}

// Stores one validated telemetry record for an authenticated bin, whether it
// arrived over the bin's own cellular link or was relayed by a mesh gateway.
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
    sleepDurationSeconds,
    meshAwakeWindowSeconds,
    lastAwakeSeconds,
    driftPpm,
    clockErrorSeconds,
    wakeOffsetSeconds,
}, { via, gatewayId = null, hops = null, rssi = null, reportIntervalMinutes, reportStartHour }) {
    const schedule = getNextReportSchedule(location, reportIntervalMinutes, reportStartHour);
    // A gateway has no fill sensor: a level it sends is ignored, and its level
    // fields stay untouched so it never reads as a bin with a failed sensor.
    const isGateway = bin.kind === "gateway";
    if (isGateway) {
        level = undefined;
    }

    const severity = level >= 80 || battery <= 20 || health === 'critical'
        ? 'critical'
        : level >= 50 || battery <= 50 || health === 'warning'
            ? 'warning'
            : 'info';
    const messages = [];
    if (sensorOk !== false && level >= 80) messages.push('Bin fill level is critical.');
    else if (sensorOk !== false && level >= 50) messages.push('Bin fill level requires attention.');
    if (battery <= 20) messages.push('Battery level is critical.');
    else if (battery <= 50) messages.push('Battery level is low.');
    if (healthMessage) messages.push(healthMessage);
    const message = messages.length > 0 ? messages.join(' ') : null;

    const weightKg = weight <= 0 ? 0 : weight / 1000; // Ensure weight is not negative, convert grams to kilograms

    const levelIsValid = !isGateway && sensorOk !== false;
    let query = {
        binId: bin._id,
        location,
        health,
        oldLevel: isGateway ? null : bin.status.level,
        newLevel: levelIsValid ? level : null,
        battery,
        ...(sleepDurationSeconds === undefined ? {} : { sleepDurationSeconds }),
        ...(meshAwakeWindowSeconds === undefined ? {} : { meshAwakeWindowSeconds }),
        ...(lastAwakeSeconds === undefined ? {} : { lastAwakeSeconds }),
        ...clockDiagnostics({ driftPpm, clockErrorSeconds, wakeOffsetSeconds }),
        connection: via,
        ...(gatewayId === null ? {} : { gatewayId }),
        ...(hops === null ? {} : { hops }),
        ...(rssi === null ? {} : { rssi }),
        severity,
        type: 'log',
        source: 'sensor',
        weight: weightKg
    };
    query = appendFilter(query, message, 'message', message);

    await binLogModel.create(query);

    bin.status.updatedAt = new Date();
    bin.status.health = health;
    bin.status.healthMessage = healthMessage || "";
    if (!isGateway) {
        bin.status.levelValid = levelIsValid;
        if (levelIsValid) {
            bin.status.level = level;
        }
    }
    bin.status.battery = battery;
    if (sleepDurationSeconds !== undefined) {
        bin.status.deepSleepSeconds = sleepDurationSeconds;
    }
    if (meshAwakeWindowSeconds !== undefined) {
        bin.status.meshAwakeWindowSeconds = meshAwakeWindowSeconds;
    }
    if (lastAwakeSeconds !== undefined) {
        bin.status.lastAwakeSeconds = lastAwakeSeconds;
    }
    bin.status.weight = weightKg;
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
    } = await applyDeviceLog(bin, record, { via: "cellular", reportIntervalMinutes, reportStartHour });

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
