import mongoose from "mongoose";

export const deviceInstructionSchema = new mongoose.Schema({
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bin",
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 64,
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "cancelled"],
        default: "pending",
        index: true,
    },
    deliveryAttempts: {
        type: Number,
        default: 0,
    },
    lastDeliveredAt: Date,
    completedAt: Date,
    result: {
        type: String,
        maxlength: 256,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });

deviceInstructionSchema.index({ binId: 1, status: 1, createdAt: 1 });
