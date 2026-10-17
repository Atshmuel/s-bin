import mongoose from "mongoose";

// Each organization's bins form their own ESP-NOW mesh, so all of them must
// stay awake for the same minimum window after the shared wake-up time.
export const DEFAULT_MESH_AWAKE_WINDOW_SECONDS = 10;
export const MAX_MESH_AWAKE_WINDOW_SECONDS = 60;
// How often the organization's devices report. Every option divides 24 hours,
// so the slots stay aligned; below 30 minutes gateways learn no clock drift.
export const REPORT_INTERVAL_OPTIONS_MINUTES = Object.freeze([15, 30, 60, 120, 180, 240, 360, 720, 1440]);
export const DEFAULT_REPORT_INTERVAL_MINUTES = 720;
// The first report of the day, in each device's local time; the rest follow
// every interval from it.
export const DEFAULT_REPORT_START_HOUR = 8;

export const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    meshAwakeWindowSeconds: {
        type: Number,
        min: 1,
        max: MAX_MESH_AWAKE_WINDOW_SECONDS,
        default: DEFAULT_MESH_AWAKE_WINDOW_SECONDS,
        validate: {
            validator: Number.isInteger,
            message: "meshAwakeWindowSeconds must be an integer"
        }
    },
    reportIntervalMinutes: {
        type: Number,
        default: DEFAULT_REPORT_INTERVAL_MINUTES,
        validate: {
            validator: (value) => REPORT_INTERVAL_OPTIONS_MINUTES.includes(value),
            message: `reportIntervalMinutes must be one of ${REPORT_INTERVAL_OPTIONS_MINUTES.join(", ")}`
        }
    },
    reportStartHour: {
        type: Number,
        min: 0,
        max: 23,
        default: DEFAULT_REPORT_START_HOUR,
        validate: {
            validator: Number.isInteger,
            message: "reportStartHour must be an integer"
        }
    },
});

