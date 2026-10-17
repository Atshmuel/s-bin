import mongoose from "mongoose";
import { getBinByMacAndKeyShared, getOrgDeviceSettingsShared } from "../../db/service/sharedService.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { deviceInstructionModel } from "../../db/models/models.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";

export async function handleInstructionCheck(mac, { deviceKey }) {
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

    const { meshAwakeWindowSeconds, reportIntervalMinutes } = await getOrgDeviceSettingsShared(bin.ownerId);
    const { timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds } =
        getNextReportSchedule(bin.location.coordinates, reportIntervalMinutes);
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

export async function handleInstructionResult(mac, { deviceKey, instructionId, status, result }) {
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
