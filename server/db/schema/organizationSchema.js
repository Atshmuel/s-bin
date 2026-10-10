import mongoose from "mongoose";

// Each organization's bins form their own ESP-NOW mesh, so all of them must
// stay awake for the same minimum window after the shared wake-up time.
export const DEFAULT_MESH_AWAKE_WINDOW_SECONDS = 10;
export const MAX_MESH_AWAKE_WINDOW_SECONDS = 60;

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
});

