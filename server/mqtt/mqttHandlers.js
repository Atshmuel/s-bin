import { getBinByMacAndKeyShared, getUserShared, organizationExist } from "../db/service/sharedService.js";
import { appendFilter, checkPayloadFields, generateRandomToken } from '../utils/helpers.js'
import { mqttClient } from './mqttClient.js'
import { BIN_REGISTER_TOPIC, BIN_ACK_TOPIC, BIN_ACK_COMMAND } from "./mqttTopics.js";
import { binLogModel, binModel } from "../db/models/models.js";
import { getNextReportSchedule } from "../utils/deviceSchedule.js";

export async function handleMqttMessage(topic, payload) {
    if (topic === BIN_REGISTER_TOPIC) {
        await handleRegistration(payload);
        return;
    }

    const parts = topic.split("/"); // bins/<mac>/update/<field>
    if (parts.length !== 4) {
        console.warn("Unknown topic format:", topic);
        return;
    }

    const mac = parts[1];
    const field = parts[3];
    console.log(`Received message for bin ${mac} on field ${field}:`, payload);
    switch (field) {
        case "log":
            await handleDeviceLog(mac, payload);
            break;
        case "error":
            await handleDeviceError(mac, payload);
            break;
        case "maintenance":
            await handleDeviceMaintenance(mac, payload);
            break;
        default:
            console.log("Unknown topic:", field);
    }
}

async function handleRegistration({ mac, orgId, location, battery }) {
    try {

        const orgExist = await organizationExist(orgId)
        if (!orgExist) {
            console.log("Organization not found");
            return;
        }

        const existingBin = await binModel.findOne({ macAddress: mac });
        if (existingBin) {
            console.log("Bin already exists");
            return;
        }

        if (!Array.isArray(location) || location.length !== 2 ||
            typeof location[0] !== "number" || !Number.isFinite(location[0]) ||
            typeof location[1] !== "number" || !Number.isFinite(location[1]) ||
            location[0] < -90 || location[0] > 90 ||
            location[1] < -180 || location[1] > 180 ||
            typeof battery !== 'number' || battery < 0 || battery > 100) {
            console.log("Invalid location or battery data");
            return;
        }
        const { timeZone, nextWakeEpoch } = getNextReportSchedule(location);

        const deviceKey = generateRandomToken();
        // 0,5 to get first 5 chars for example: 1D:44:8E:A7:32:5D -> 1D:44 date used for uniqueness validity
        const binName = `Bin-${mac.slice(0, 5)}-${Date.now().toString().slice(-4)}`;

        const newBin = await binModel.create({
            binName,
            macAddress: mac,
            ownerId: orgId,
            deviceKey,
            location: {
                type: "Point",
                coordinates: location || [0, 0],
            },
            timezone: timeZone,
            status: {
                battery: battery
            }

        });
        console.log("Registered new bin via MQTT:", newBin);
        mqttClient.publish(
            `${BIN_ACK_TOPIC}/${mac}`,
            JSON.stringify({ status: "registered", deviceKey, timeZone, nextWakeEpoch })
        );
    } catch (error) {
        console.error("Error registering bin via MQTT:", error);
    }
}

async function handleDeviceLog(mac, { deviceKey, location, health, level, sensorOk, battery, weight, message: healthMessage }) {
    if (!checkPayloadFields({ location, health, level, sensorOk, battery, weight, message: healthMessage })) return;

    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) return;
    const { timeZone, nextWakeEpoch } = getNextReportSchedule(location);

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

    weight = weight <= 0 ? 0 : weight / 1000; // Ensure weight is not negative, convert grams to kilograms

    const levelIsValid = sensorOk !== false;
    let query = {
        binId: bin._id,
        location,
        health,
        oldLevel: bin.status.level,
        newLevel: levelIsValid ? level : null,
        battery,
        severity,
        type: 'log',
        source: 'sensor',
        weight
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
    bin.status.weight = weight;
    bin.location.coordinates = location;
    bin.timezone = timeZone;
    if (message) {
        bin.maintenance.notes = `Last updated via MQTT on ${new Date().toLocaleString()}, message: ${message}`;
    }
    await bin.save();

    console.log("Updated log for", mac);
    mqttClient.publish(
        `${BIN_ACK_TOPIC}/${mac}`,
        JSON.stringify({ status: "Log updated", mac, timeZone, nextWakeEpoch })
    );
}


//TODO: implement these handlers
async function handleDeviceError(mac, { deviceKey, location, health, level, battery, message }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}
async function handleDeviceMaintenance(mac, { deviceKey, location, health, level, battery }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}


export function removeBinConfig(macId) {
    mqttClient.publish(`${BIN_ACK_COMMAND}/${macId}`, JSON.stringify({
        command: "reset",
        reason: "removed_by_user"
    }));
}
