import mongoose from "mongoose";

export const binSchema = new mongoose.Schema({
    binCode: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        health: {
            type: String,
            enum: ["good", "warning", "critical"],
            default: "good"
        },
        level: { type: Number, default: 0, required: true },
        updatedAt: { type: Date, default: Date.now }
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    levelLogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BinLog"
        }
    ]
}, { timestamps: true });

binSchema.index({ ownerId: 1 });