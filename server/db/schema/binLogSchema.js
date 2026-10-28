import mongoose from "mongoose";
import { MAX_ABS_CLOCK_ERROR_SECONDS, MAX_ABS_DRIFT_PPM, MAX_LAST_AWAKE_SECONDS } from '../../utils/constants.js'

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
    lastAwakeSeconds: { type: Number, min: 1, max: MAX_LAST_AWAKE_SECONDS },
    // Sleep-clock diagnostics: the device's drift estimate and how far its
    // clock was off when it synced.
    driftPpm: { type: Number, min: -MAX_ABS_DRIFT_PPM, max: MAX_ABS_DRIFT_PPM },
    clockErrorSeconds: { type: Number, min: -MAX_ABS_CLOCK_ERROR_SECONDS, max: MAX_ABS_CLOCK_ERROR_SECONDS },
    // What the device reported about itself, its fields checked one by one
    // (utils/diagnostics.js): firmware, restart, power, temperatures, sample
    // spread, stage times, the cell, a leaf's guard.
    diagnostics: { type: mongoose.Schema.Types.Mixed, default: undefined },
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
// The logs page's sorts (newest first by default), _id breaking ties.
binLogSchema.index({ createdAt: -1, _id: -1 });
binLogSchema.index({ newLevel: -1, _id: -1 });
binLogSchema.index({ weight: -1, _id: -1 });
binLogSchema.index({ battery: -1, _id: -1 });

binLogSchema.virtual("bin", {
    ref: "Bin",
    localField: 'binId',
    foreignField: "_id",
    justOne: true,
})

binLogSchema.set("toObject", { virtuals: true });
binLogSchema.set("toJSON", { virtuals: true });