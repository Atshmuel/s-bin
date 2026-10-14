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
    newLevel: { type: Number, default: null },
    battery: { type: Number, required: true },
    sleepDurationSeconds: { type: Number, min: 1, max: 86400 },
    meshAwakeWindowSeconds: { type: Number, min: 1, max: 60 },
    lastAwakeSeconds: { type: Number, min: 1, max: 86400 },
    // Sleep-clock diagnostics: the device's drift estimate, how far its clock
    // was off when it synced, and when it woke relative to its slot (<0 early).
    driftPpm: { type: Number, min: -100000, max: 100000 },
    clockErrorSeconds: { type: Number, min: -86400, max: 86400 },
    wakeOffsetSeconds: { type: Number, min: -3600, max: 3600 },
    connection: { type: String, enum: ["cellular", "mesh"] },
    gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: "Bin" },
    hops: { type: Number, min: 1, max: 8 },
    rssi: { type: Number, min: -128, max: 0 },
    weight: { type: Number, required: true },
    health: {
        type: String,
        enum: ["good", "warning", "critical"],
        default: "good"
    },
    source: {
        type: String,
        enum: ["sensor", "manual", "system"],
        default: "sensor",
    },
    message: String,

}, { timestamps: true });


binLogSchema.virtual("bin", {
    ref: "Bin",
    localField: 'binId',
    foreignField: "_id",
    justOne: true,
})

binLogSchema.set("toObject", { virtuals: true });
binLogSchema.set("toJSON", { virtuals: true });