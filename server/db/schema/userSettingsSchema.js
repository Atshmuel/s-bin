import mongoose from "mongoose";

export const userSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: {
        email: { type: Boolean, default: true },
        // whatsApp: { type: Boolean, default: false },
    },
    alertLevel: {
        health: { type: String, enum: ["good", "warning", "critical"], default: "warning" },
        level: { type: Number, min: 0, max: 100, default: 50 }
    },
    timezone: { type: String, default: 'Asia/Jerusalem' },
    appLanguage: { type: String, enum: ["en", "he"], default: "en" }
}, { timestamps: true });

userSettingsSchema.index({ userId: 1 }, { unique: true });
