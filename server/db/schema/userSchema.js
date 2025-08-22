import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ["owner", "admin", "operator"],
        default: "operator"
    },
    passwordHash: { type: String, required: true }
});

