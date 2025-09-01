import mongoose from "mongoose";

export const binLogSchema = new mongoose.Schema({
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bin",
        required: true,
        immutable: true,
    },
    level: { type: Number, required: true },
}, { timestamps: true });