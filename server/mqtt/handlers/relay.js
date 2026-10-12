import { getBinByMacAndKeyShared } from "../../db/service/sharedService.js";
import { generateRandomToken } from "../../utils/helpers.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { binModel } from "../../db/models/models.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";
import { applyDeviceLog, isValidTelemetryRecord } from "./telemetry.js";

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
export async function handleRelay(gatewayMac, { deviceKey, leafMac, messageId, hops, rssi, record }) {
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
