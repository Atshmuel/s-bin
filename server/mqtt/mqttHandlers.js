import { getBinByMacAndKeyShared, getUserShared } from "../db/service/sharedService.js";
import { appendFilter, checkPayloadFields, generateRandomToken } from '../utils/helpers.js'
import { mqttClient } from './mqttClient.js'
import { BIN_REGISTER_TOPIC, BIN_ACK_TOPIC, BIN_ACK_COMMAND } from "./mqttTopics.js";
import { binLogModel, binModel } from "../db/models/models.js";

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

async function handleRegistration({ mac, userId, location, battery }) {
    try {

        const existingUser = await getUserShared(userId);
        if (!existingUser) {
            console.log("User not found");
            return;
        }

        const existingBin = await binModel.findOne({ macAddress: mac });
        if (existingBin) {
            console.log("Bin already exists");
            return;
        }

        if (!Array.isArray(location) || location.length !== 2 || typeof battery !== 'number' || battery < 0 || battery > 100) {
            console.log("Invalid location or battery data");
            return;
        }

        const deviceKey = generateRandomToken();
        const binName = `Bin-${mac.slice(-4)}-${Date.now().toString().slice(-4)}`;

        const newBin = await binModel.create({
            binName,
            macAddress: mac,
            ownerId: userId,
            deviceKey,
            location: {
                type: "Point",
                coordinates: location || [0, 0],
            },
            status: {
                battery: battery
            }

        });
        console.log("Registered new bin via MQTT:", newBin);
        mqttClient.publish(
            `${BIN_ACK_TOPIC}/${mac}`,
            JSON.stringify({ status: "registered", deviceKey }) // send deviceKey back to device for future authentication
        );
    } catch (error) {
        console.error("Error registering bin via MQTT:", error);
    }
}

async function handleDeviceLog(mac, { deviceKey, location, health, level, battery }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) return;

    let severity = 'info';
    let message = null;
    if (health === 'warning' || (level <= 60 && level > 80) || (battery <= 50 && battery > 30)) {
        severity = 'warning';
        message = 'Check soon and schedule maintenance.';
    }
    if (health === 'critical' || level >= 80 || battery <= 30) {
        severity = 'critical';
        message = 'Immediate attention required, notify maintenance team.';
    };

    let query = { binId: bin._id, location, health, oldLevel: bin.status.level, newLevel: level, battery, severity, type: 'log', source: 'sensor' }
    query = appendFilter(query, message, 'message', message);

    await binLogModel.create(query);

    bin.status.updatedAt = new Date();
    bin.status.health = health;
    bin.status.level = level;
    bin.status.battery = battery;
    bin.location.coordinates = location;
    await bin.save();

    console.log("Updated log for", mac);
    mqttClient.publish(
        `${BIN_ACK_TOPIC}/${mac}`,
        JSON.stringify({ status: "Log updated for ", mac })
    );
}


//TODO: implement these handlers
async function handleDeviceError(mac, { deviceKey, location, health, level, battery, message }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}
async function handleDeviceMaintenance(mac, { deviceKey, location, health, level, battery }) {
    if (!checkPayloadFields({ location, health, level, battery })) return;

}


export function removeBinConfig(mac) {
    mqttClient.publish(`${BIN_ACK_COMMAND}/${mac}`, JSON.stringify({
        command: "reset",
        reason: "removed_by_user"
    }));
}

