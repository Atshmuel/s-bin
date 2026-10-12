import mongoose from "mongoose";
import { getBinByMacAndKeyShared, getOrgMeshAwakeWindowShared, getUserShared, organizationExist } from "../db/service/sharedService.js";
import { appendFilter, checkPayloadFields, generateRandomToken } from '../utils/helpers.js'
import { mqttClient } from './mqttClient.js'
import { BIN_REGISTER_TOPIC, BIN_ACK_TOPIC, BIN_ACK_COMMAND } from "./mqttTopics.js";
import { binLogModel, binModel, deviceInstructionModel } from "../db/models/models.js";
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
        case "instructions":
            await handleInstructionCheck(mac, payload);
            break;
        case "instruction-result":
            await handleInstructionResult(mac, payload);
            break;
        case "relay":
            await handleRelay(mac, payload);
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
        const { timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds } =
            getNextReportSchedule(location);

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
        const meshAwakeWindowSeconds = await getOrgMeshAwakeWindowShared(orgId);
        mqttClient.publish(
            `${BIN_ACK_TOPIC}/${mac}`,
            JSON.stringify({
                status: "registered",
                deviceKey,
                timeZone,
                nextWakeEpoch,
                followingWakeEpoch,
                sleepDurationSeconds,
                meshAwakeWindowSeconds,
            })
        );
    } catch (error) {
        console.error("Error registering bin via MQTT:", error);
    }
}

function isValidTelemetryRecord({
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
async function applyDeviceLog(bin, {
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

async function handleDeviceLog(mac, { deviceKey, ...record }) {
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

const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const MAX_MESH_HOPS = 8;
const RECENT_MESH_MESSAGE_IDS = 8;

function publishRelayResult(gatewayMac, leafMac, messageId, accepted, reason) {
    mqttClient.publish(`${BIN_ACK_TOPIC}/${gatewayMac}`, JSON.stringify({
        status: "relay_result",
        leafMac,
        messageId,
        accepted,
        ...(reason === undefined ? {} : { reason }),
    }), { qos: 1 }, error => {
        if (error) {
            console.error(`Failed to send relay result to ${gatewayMac}:`, error);
        }
    });
}

async function findOrCreateLeafBin(leafMac, gateway, record) {
    const existing = await binModel.findOne({ macAddress: leafMac });
    if (existing) return existing;

    try {
        return await binModel.create({
            binName: `Bin-${leafMac.slice(0, 5)}-${Date.now().toString().slice(-4)}`,
            macAddress: leafMac,
            ownerId: gateway.ownerId,
            deviceKey: generateRandomToken(),
            location: { type: "Point", coordinates: record.location },
            timezone: getNextReportSchedule(record.location).timeZone,
            status: { battery: record.battery },
        });
    } catch (error) {
        // Another gateway relayed the same new leaf at the same moment.
        if (error?.code === 11000) {
            return binModel.findOne({ macAddress: leafMac });
        }
        throw error;
    }
}

// A mesh gateway uploads a reading it took custody of from a leaf without a SIM.
// The leaf has no device key, so the authenticated gateway vouches for it; leaves
// are created in, and limited to, the gateway's organization.
async function handleRelay(gatewayMac, { deviceKey, leafMac, messageId, hops, rssi, record }) {
    const gateway = await getBinByMacAndKeyShared(gatewayMac, deviceKey);
    if (!gateway) {
        console.warn(`Relay rejected for ${gatewayMac}: invalid gateway credentials.`);
        return;
    }
    if (typeof leafMac !== "string" || !MAC_ADDRESS_PATTERN.test(leafMac) ||
        !Number.isInteger(messageId) || messageId < 0 || messageId > 0xFFFFFFFF) {
        console.warn(`Relay from ${gatewayMac} has no valid leaf MAC or message ID.`);
        return;
    }
    // Permanent rejections are still answered so the gateway drops the record.
    if (leafMac.toUpperCase() === gatewayMac.toUpperCase() ||
        !Number.isInteger(hops) || hops < 1 || hops > MAX_MESH_HOPS ||
        (rssi !== undefined && (!Number.isInteger(rssi) || rssi < -128 || rssi > 0)) ||
        !record || typeof record !== "object" || Array.isArray(record)) {
        publishRelayResult(gatewayMac, leafMac, messageId, false, "invalid_envelope");
        return;
    }

    const leafRecord = record.location === undefined
        ? { ...record, location: gateway.location.coordinates }
        : record;
    if (!isValidTelemetryRecord(leafRecord)) {
        publishRelayResult(gatewayMac, leafMac, messageId, false, "invalid_record");
        return;
    }

    const leaf = await findOrCreateLeafBin(leafMac, gateway, leafRecord);
    if (!leaf.ownerId.equals(gateway.ownerId)) {
        console.warn(`Relay rejected: leaf ${leafMac} belongs to another organization than gateway ${gatewayMac}.`);
        publishRelayResult(gatewayMac, leafMac, messageId, false, "organization_mismatch");
        return;
    }

    // Claim the message ID first so two gateways uploading the same reading
    // cannot both store it; release the claim if storing fails.
    const claim = await binModel.updateOne(
        { _id: leaf._id, "status.recentMeshMessageIds": { $ne: messageId } },
        { $push: { "status.recentMeshMessageIds": { $each: [messageId], $slice: -RECENT_MESH_MESSAGE_IDS } } }
    );
    if (claim.modifiedCount === 0) {
        console.log(`Duplicate relay of message ${messageId} for ${leafMac}; acknowledging again.`);
        publishRelayResult(gatewayMac, leafMac, messageId, true, "duplicate");
        return;
    }

    try {
        await applyDeviceLog(leaf, leafRecord, {
            via: "mesh",
            gatewayId: gateway._id,
            hops,
            rssi: rssi ?? null,
        });
    } catch (error) {
        await binModel.updateOne(
            { _id: leaf._id },
            { $pull: { "status.recentMeshMessageIds": messageId } }
        );
        throw error;
    }

    console.log(`Stored relayed log for ${leafMac} via ${gatewayMac} (${hops} hop(s)).`);
    publishRelayResult(gatewayMac, leafMac, messageId, true);
}

async function handleInstructionCheck(mac, { deviceKey }) {
    if (!deviceKey) {
        console.warn(`Instruction check rejected for ${mac}: missing device key.`);
        return;
    }

    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) {
        console.warn(`Instruction check rejected for ${mac}: invalid device credentials.`);
        return;
    }

    const pendingInstructions = await deviceInstructionModel.find({
        binId: bin._id,
        status: "pending"
    })
        .sort({ createdAt: 1 })
        .limit(2)
        .lean();
    const instructions = pendingInstructions.map(({ _id, type, payload }) => ({
        id: _id.toString(),
        type,
        payload
    }));

    const { timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds } =
        getNextReportSchedule(bin.location.coordinates);
    const meshAwakeWindowSeconds = await getOrgMeshAwakeWindowShared(bin.ownerId);
    const response = JSON.stringify({
        status: "instruction_check",
        canSleep: instructions.length === 0,
        instructions,
        timeZone,
        nextWakeEpoch,
        followingWakeEpoch,
        sleepDurationSeconds,
        meshAwakeWindowSeconds,
    });
    mqttClient.publish(`${BIN_ACK_TOPIC}/${mac}`, response, { qos: 1 }, async error => {
        if (error) {
            console.error(`Failed to reply to instruction check for ${mac}:`, error);
            return;
        }
        if (pendingInstructions.length > 0) {
            try {
                await deviceInstructionModel.updateMany(
                    {
                        _id: { $in: pendingInstructions.map(instruction => instruction._id) },
                        status: "pending"
                    },
                    {
                        $inc: { deliveryAttempts: 1 },
                        $set: { lastDeliveredAt: new Date() }
                    }
                );
            } catch (updateError) {
                console.error(`Failed to record instruction delivery attempts for ${mac}:`, updateError);
            }
        }
    });
}

async function handleInstructionResult(mac, { deviceKey, instructionId, status, result }) {
    if (!deviceKey || !mongoose.Types.ObjectId.isValid(instructionId) ||
        !["completed", "failed"].includes(status) ||
        (result !== undefined && (typeof result !== "string" || result.length > 256))) {
        console.warn(`Invalid instruction result received for ${mac}.`);
        return;
    }

    const bin = await getBinByMacAndKeyShared(mac, deviceKey);
    if (!bin) {
        console.warn(`Instruction result rejected for ${mac}: invalid device credentials.`);
        return;
    }

    let instruction = await deviceInstructionModel.findOneAndUpdate(
        { _id: instructionId, binId: bin._id, status: "pending" },
        {
            $set: {
                status,
                completedAt: new Date(),
                ...(result === undefined ? {} : { result })
            }
        },
        { new: true }
    );
    if (!instruction) {
        instruction = await deviceInstructionModel.findOne({ _id: instructionId, binId: bin._id });
        if (instruction?.status !== status) {
            console.warn(`Instruction result ignored for ${mac}: instruction is missing or has a different final status.`);
            return;
        }
    }

    mqttClient.publish(`${BIN_ACK_TOPIC}/${mac}`, JSON.stringify({
        status: "instruction_result",
        instructionId: instruction._id.toString(),
        accepted: true
    }), { qos: 1 }, error => {
        if (error) {
            console.error(`Failed to acknowledge instruction result for ${mac}:`, error);
        }
    });
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
