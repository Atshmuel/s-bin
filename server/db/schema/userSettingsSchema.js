import mongoose from "mongoose";

export const userSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Dark (true), light (false), or null to follow the device's setting.
    isDark: { type: Boolean, default: null },
    notifications: {
        // The daily report email (db/cron/dailyReport.js).
        email: { type: Boolean, default: true },
        // whatsApp: { type: Boolean, default: false },
    },
    timezone: { type: String, default: 'Asia/Jerusalem' },
    appLanguage: { type: String, enum: ["en", "he"], default: "en" }
}, { timestamps: true });

userSettingsSchema.index({ userId: 1 }, { unique: true });
