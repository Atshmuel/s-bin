import mongoose from "mongoose";
import {
    DEFAULT_MESH_AWAKE_WINDOW_SECONDS, DEFAULT_REPORT_INTERVAL_MINUTES, DEFAULT_REPORT_START_HOUR,
    MAX_MESH_AWAKE_WINDOW_SECONDS, REPORT_INTERVAL_OPTIONS_MINUTES,
} from "../../utils/constants.js";

// Each organization's bins form their own ESP-NOW mesh, so all of them stay
// awake for the same minimum window after the shared wake-up time, and report
// on the same schedule (see the reporting schedule in utils/constants.js).

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

