import mongoose from "mongoose";
import { deviceInstructionModel } from "../models/models.js";
import { getBinShared } from "../service/sharedService.js";

const MAX_AWAKE_EXTENSION_SECONDS = 3600;
const supportedInstructionTypes = new Set(["report_now", "stay_awake"]);

function isValidInstructionPayload(type, payload) {
    if (type === "report_now") {
        return Object.keys(payload).length === 0;
    }

    return type === "stay_awake" &&
        Object.keys(payload).length === 1 &&
        Number.isInteger(payload.durationSeconds) &&
        payload.durationSeconds >= 1 &&
        payload.durationSeconds <= MAX_AWAKE_EXTENSION_SECONDS;
}

export async function enqueueDeviceInstruction(req, res) {
    const { type, payload = {} } = req.body ?? {};
    if (typeof type !== "string" || !supportedInstructionTypes.has(type)) {
        return res.status(400).json({
            message: `Unsupported instruction type. Supported types: ${[...supportedInstructionTypes].join(", ")}.`
        });
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return res.status(400).json({ message: "Instruction payload must be a JSON object." });
    }
    if (!isValidInstructionPayload(type, payload)) {
        const message = type === "report_now"
            ? "report_now does not accept a payload."
            : "stay_awake requires durationSeconds between 1 and 3600.";
        return res.status(400).json({ message });
    }

    const serializedPayload = JSON.stringify(payload);
    if (Buffer.byteLength(serializedPayload, "utf8") > 256) {
        return res.status(400).json({ message: "Instruction payload must not exceed 256 bytes." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid bin ID." });
    }
    const bin = await getBinShared(req.params.id);
    if (!bin || (req.user.role !== process.env.ROLE_OWNER &&
        bin.ownerId?.toString() !== req.user.org)) {
        return res.status(404).json({ message: "Bin not found." });
    }

    const instruction = await deviceInstructionModel.create({
        binId: bin._id,
        type,
        payload,
        createdBy: req.user.id,
    });
    return res.status(201).json({ instruction });
}

export async function listDeviceInstructions(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid bin ID." });
    }
    const bin = await getBinShared(req.params.id);
    if (!bin || (req.user.role !== process.env.ROLE_OWNER &&
        bin.ownerId?.toString() !== req.user.org)) {
        return res.status(404).json({ message: "Bin not found." });
    }

    const status = req.query.status;
    const filter = { binId: bin._id };
    if (status !== undefined) {
        if (!["pending", "completed", "failed", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid instruction status." });
        }
        filter.status = status;
    }

    const instructions = await deviceInstructionModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    return res.status(200).json({ instructions });
}

export async function cancelDeviceInstruction(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid bin ID." });
    }
    const bin = await getBinShared(req.params.id);
    if (!bin || (req.user.role !== process.env.ROLE_OWNER &&
        bin.ownerId?.toString() !== req.user.org)) {
        return res.status(404).json({ message: "Bin not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.instructionId)) {
        return res.status(400).json({ message: "Invalid instruction ID." });
    }
    const instruction = await deviceInstructionModel.findOneAndUpdate(
        { _id: req.params.instructionId, binId: bin._id, status: "pending" },
        { $set: { status: "cancelled" } },
        { new: true }
    );
    if (!instruction) {
        return res.status(404).json({ message: "Pending instruction not found." });
    }
    return res.status(200).json({ instruction });
}
