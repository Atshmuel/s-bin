import mongoose from "mongoose";

export const userSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDark: { type: Boolean, default: false },
    notifications: {
        // The daily report email (db/cron/dailyReport.js).
        email: { type: Boolean, default: true },
        // whatsApp: { type: Boolean, default: false },
    },
    timezone: { type: String, default: 'Asia/Jerusalem' },
    appLanguage: { type: String, enum: ["en", "he"], default: "en" }
}, { timestamps: true });

userSettingsSchema.index({ userId: 1 }, { unique: true });
