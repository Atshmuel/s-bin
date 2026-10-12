import { getBinByMacAndKeyShared, getOrgMeshAwakeWindowShared } from "../../db/service/sharedService.js";
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
}) {
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
    });
}

// Stores one validated telemetry record for an authenticated bin, whether it
// arrived over the bin's own cellular link or was relayed by a mesh gateway.
// Returns the bin's next report schedule.
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
}, { via, gatewayId = null, hops = null, rssi = null }) {
    const schedule = getNextReportSchedule(location);

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

    const levelIsValid = sensorOk !== false;
    let query = {
        binId: bin._id,
        location,
        health,
        oldLevel: bin.status.level,
        newLevel: levelIsValid ? level : null,
        battery,
        ...(sleepDurationSeconds === undefined ? {} : { sleepDurationSeconds }),
        ...(meshAwakeWindowSeconds === undefined ? {} : { meshAwakeWindowSeconds }),
        ...(lastAwakeSeconds === undefined ? {} : { lastAwakeSeconds }),
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
    bin.status.levelValid = levelIsValid;
    if (levelIsValid) {
        bin.status.level = level;
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
    if (!isValidTelemetryRecord(record)) return;

    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) return;
    const {
        timeZone,
        nextWakeEpoch,
        followingWakeEpoch,
        sleepDurationSeconds: scheduledSleepDurationSeconds,
    } = await applyDeviceLog(bin, record, { via: "cellular" });

    console.log("Updated log for", mac);
    const orgMeshAwakeWindowSeconds = await getOrgMeshAwakeWindowShared(bin.ownerId);
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
