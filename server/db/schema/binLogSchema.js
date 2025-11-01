import mongoose from "mongoose";

export const binLogSchema = new mongoose.Schema({
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bin",
        required: true,
        immutable: true,
    },
    type: {
        type: String,
        enum: ["maintenance", "error", "log"],
        default: "log",
    },
    severity: {
        type: String,
        enum: ["info", "warning", "critical"],
        default: "info",
    },
    oldLevel: Number,
    newLevel: { type: Number, required: true },
    battery: { type: Number, required: true },
    health: {
        type: String,
        enum: ["good", "warning", "critical"],
        default: "good"
    },
    source: {
        type: String,
        enum: ["sensor", "manual"],
        default: "sensor",
    },
    message: String,

}, { timestamps: true });