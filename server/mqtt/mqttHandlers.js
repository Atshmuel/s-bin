import { getUserShared } from "../db/service/sharedService.js";
import { generateRandomToken } from '../utils/helpers.js'
import { mqttClient } from './mqttClient.js'
import { BIN_REGISTER_TOPIC, BIN_ACK_TOPIC } from "./mqttTopics.js";
import { binModel } from "../db/models/models.js";

export async function handleMqttMessage(topic, payload) {
    if (topic === BIN_REGISTER_TOPIC) {
        console.log(payload);

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
        case "location":
            await handleLocation(mac, payload);
            break;
        case "health":
            await handleHealth(mac, payload);
            break;
        case "level":
            await handleLevel(mac, payload);
            break;
        default:
            console.log("Unknown topic:", field);
    }
}

async function handleRegistration({ mac, userId, location, }) {
    try {

        const existingUser = await getUserShared(userId);
        if (!existingUser) {
            console.log("User not found");
            return;
        }

        const existingBin = await binModel.findOne({ macAddress: mac });
        if (existingBin) {
            console.log("Bin already exists");
            mqttClient.publish(
                `${BIN_ACK_TOPIC}/${mac}`,
                JSON.stringify({ status: "already_registered", deviceKey: existingBin.deviceKey })
            ); //notify device of existing registration
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
            }

        });
        console.log("Registered new bin via MQTT:", newBin);
        mqttClient.publish(
            `${BIN_ACK_TOPIC}/${mac}`,
            JSON.stringify({ status: "registered", deviceKey })
        );
    } catch (error) {
        console.error("Error registering bin via MQTT:", error);
    }
}

async function handleLocation(mac, { deviceKey, location }) {
    if (!Array.isArray(location) || location.length !== 2) return;

    await binLogModel.findOneAndUpdate(
        { macAddress: mac, deviceKey },
        { $set: { "location.coordinates": location } },
        { new: true }
    );
    console.log("Updated location for", mac);
}

async function handleHealth(mac, { deviceKey, health }) {
    const valid = ["good", "warning", "critical"];
    if (!valid.includes(health)) return;

    await binModel.findOneAndUpdate(
        { macAddress: mac, deviceKey },
        { $set: { "status.health": health } },
        { new: true }
    );
    console.log("Updated health for", mac);
}

async function handleLevel(mac, { deviceKey, level }) {
    if (typeof level !== "number" || level < 0 || level > 100) return;

    await binModel.findOneAndUpdate(
        { macAddress: mac, deviceKey },
        { $set: { "status.level": level } },
        { new: true }
    );
    console.log("Updated level for", mac, level);
}

export function removeBinConfig(mac) {
    mqttClient.publish(`bins/${mac}/command`, JSON.stringify({
        command: "reset",
        reason: "removed_by_user"
    }));
}