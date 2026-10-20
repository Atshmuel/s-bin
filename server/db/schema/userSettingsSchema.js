import mongoose from "mongoose";
import { DEFAULT_ALERT_FULLNESS_PERCENT, MAX_DAYS_BEFORE_MAINTENANCE, MIN_DAYS_BEFORE_MAINTENANCE } from '../../utils/constants.js'

export const userSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDark: { type: Boolean, default: false },
    notifications: {
        email: { type: Boolean, default: true },
        // whatsApp: { type: Boolean, default: false },
    },
    alertLevel: {
        health: { type: String, enum: ["good", "warning", "critical"], default: "warning" },
        severity: { type: String, enum: ["info", "warning", "critical"], default: "warning" },
        level: { type: Number, min: 0, max: 100, default: DEFAULT_ALERT_FULLNESS_PERCENT },
        daysBeforeMaintenance: { type: Number, min: MIN_DAYS_BEFORE_MAINTENANCE, max: MAX_DAYS_BEFORE_MAINTENANCE, default: MAX_DAYS_BEFORE_MAINTENANCE }
    },
    timezone: { type: String, default: 'Asia/Jerusalem' },
    appLanguage: { type: String, enum: ["en", "he"], default: "en" }
}, { timestamps: true });

userSettingsSchema.index({ userId: 1 }, { unique: true });
