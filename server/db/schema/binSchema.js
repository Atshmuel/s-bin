import mongoose from "mongoose";

export const binSchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        level: { type: Number, required: true },
        updatedAt: { type: Date, default: Date.now }
    },
    history: [
        {
            level: Number,
            weight: Number,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

