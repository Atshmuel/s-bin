import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ["owner", "admin", "operator"],
        default: "operator"
    },
    passwordHash: { type: String, required: true },
    recoveryCode: {
        type: {
            otp: String,
            expiresAt: Date,
            resetToken: String,
            tokenExpiresAt: Date
        },
        required: false,
        default: undefined
    },
    accountVerification: {
        type: {
            token: String,
            expiresAt: Date,
        },
        required: false,
        default: undefined
    },
    status: {
        type: String,
        enum: ["pending", "active", "inactive", "suspended"],
        default: "pending"
    }
});

