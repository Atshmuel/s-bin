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
    lastAwakeSeconds: { type: Number, min: 1, max: 86400 },
    // Sleep-clock diagnostics: the device's drift estimate and how far its
    // clock was off when it synced.
    driftPpm: { type: Number, min: -100000, max: 100000 },
    clockErrorSeconds: { type: Number, min: -86400, max: 86400 },
    connection: { type: String, enum: ["cellular", "mesh"] },
    gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: "Bin" },
    hops: { type: Number, min: 1, max: 8 },
    rssi: { type: Number, min: -128, max: 0 },
    // Kilograms, or null without a working, calibrated scale.
    weight: { type: Number, default: null },
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


// Every bin page and analytics query reads one bin's logs by time.
binLogSchema.index({ binId: 1, createdAt: -1 });

binLogSchema.virtual("bin", {
    ref: "Bin",
    localField: 'binId',
    foreignField: "_id",
    justOne: true,
})

binLogSchema.set("toObject", { virtuals: true });
binLogSchema.set("toJSON", { virtuals: true });