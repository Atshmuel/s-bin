import mongoose from "mongoose";
import { deviceInstructionModel } from "../models/models.js";
import { getBinShared } from "../service/sharedService.js";
import {
    LEAF_INSTRUCTION_TYPES, MAX_AWAKE_EXTENSION_SECONDS, MAX_SCALE_CALIBRATION_GRAMS, MIN_SCALE_CALIBRATION_GRAMS, ROLES,
    INSTRUCTION_PAYLOAD_MAX_BYTES, INSTRUCTIONS_LIST_LIMIT,
} from "../../utils/constants.js";

// refresh_location: the device takes a GPS fix at its next cycle (GNSS and
// cellular data cannot run together on its modem), for a bin that was moved;
// only devices with their own modem have GPS.
// become_leaf: a gateway (a device that registered with its own SIM) stops
// being one and reports as a mesh leaf, keeping its bin, settings and
// calibration; a leaf that later finds a SIM becomes a gateway again.
const supportedInstructionTypes = new Set(["report_now", "stay_awake", "calibrate_empty_bin", "calibrate_scale", "refresh_location", "become_leaf"]);

function isValidInstructionPayload(type, payload) {
    if (type === "report_now" || type === "become_leaf") {
        return Object.keys(payload).length === 0;
    }

    if (type === "calibrate_empty_bin" || type === "refresh_location") {
        return Object.keys(payload).length === 0;
    }

    if (type === "calibrate_scale") {
        return Object.keys(payload).length === 1 &&
            Number.isInteger(payload.grams) &&
            payload.grams >= MIN_SCALE_CALIBRATION_GRAMS &&
            payload.grams <= MAX_SCALE_CALIBRATION_GRAMS;
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
            : type === "stay_awake"
                ? `stay_awake requires durationSeconds between 1 and ${MAX_AWAKE_EXTENSION_SECONDS}.`
                : `${type} does not accept a payload.`;
        return res.status(400).json({ message });
    }

    const serializedPayload = JSON.stringify(payload);
    if (Buffer.byteLength(serializedPayload, "utf8") > INSTRUCTION_PAYLOAD_MAX_BYTES) {
        return res.status(400).json({ message: `Instruction payload must not exceed ${INSTRUCTION_PAYLOAD_MAX_BYTES} bytes.` });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid bin ID." });
    }
    const bin = await getBinShared(req.params.id);
    if (!bin || (req.user.role !== ROLES.OWNER &&
        bin.ownerId?.toString() !== req.user.org)) {
        return res.status(404).json({ message: "Bin not found." });
    }
    // It changes how the organization's mesh is built: the system's owners only.
    if (type === "become_leaf" && req.user.role !== ROLES.OWNER) {
        return res.status(403).json({ message: "Only an owner can turn a gateway into a leaf." });
    }
    if (type === "become_leaf" && bin.meshOnly) {
        return res.status(400).json({ message: "This device is already a mesh leaf." });
    }
    // A bin reporting through a gateway gets commands at its gateway's mesh window.
    if (bin.status?.connection?.via === "mesh" && !LEAF_INSTRUCTION_TYPES.includes(type)) {
        return res.status(400).json({ message: `${type} is not available for a bin that reports through a gateway.` });
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
    if (!bin || (req.user.role !== ROLES.OWNER &&
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
        .limit(INSTRUCTIONS_LIST_LIMIT)
        .lean();
    return res.status(200).json({ instructions });
}

export async function cancelDeviceInstruction(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid bin ID." });
    }
    const bin = await getBinShared(req.params.id);
    if (!bin || (req.user.role !== ROLES.OWNER &&
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
