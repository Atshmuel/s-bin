import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import mongoose from 'mongoose'
import {
    MAX_LAST_AWAKE_SECONDS, MINUTE_MS, OTP_EXPIRY_MINUTES, OTP_LENGTH, PASSWORD_HASH_ROUNDS, RANDOM_TOKEN_BYTES,
    REPORT_MESSAGE_MAX_LENGTH, ROLES,
} from './constants.js'

export async function generateOTP(expiryMinutes = OTP_EXPIRY_MINUTES, length = OTP_LENGTH) {
    let otp = '';
    const digits = '0123456789';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    const expiresAt = new Date(Date.now() + expiryMinutes * MINUTE_MS);

    return { otp, expiresAt, expiryMinutes };
}

export function generateVerificationLink(token) {
    if (!token) return null
    return `${process.env.CLIENT_BASE_URL_PROD}/user/verify?token=${token}`
}

export async function hashPassword(password, rounds = PASSWORD_HASH_ROUNDS) {
    if (!password || !password.length) return null
    try {
        const hashed = await bcrypt.hash(password, rounds)
        return hashed
    } catch (error) {
        console.error('Failed to hash the password');
        return null
    }
}

export async function comparePasswords(inputPassword, dbPassword) {
    if (!inputPassword) return false
    try {
        const isValid = await bcrypt.compare(inputPassword, dbPassword)
        return isValid
    } catch (error) {
        console.error('Failed to compare the password');
        return false
    }
}

export function generateToken(payload, expireTimeString) {
    if (!payload || !expireTimeString) return null
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: expireTimeString
    })
}

export function validateToken(token) {
    if (!token) return null
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN)
        return decoded
    } catch (error) {
        console.error('Token validation failed:', error.message);
        return null
    }
}

export function generateRandomToken(bytes = RANDOM_TOKEN_BYTES) {
    return crypto.randomBytes(bytes).toString('hex');
}

// Matches real bins, including documents created before the kind field existed.
export const BINS_ONLY_FILTER = Object.freeze({ kind: { $ne: "gateway" } });

export function appendFilter(baseQuery, condition, field, value) {
    return condition ? { ...baseQuery, [field]: value } : baseQuery
}

// Limits a bin query to the user's organization; an owner sees every
// organization, or the one picked on the page (selectedOrg, see the
// selectOrganization middleware).
export function scopeToOrganization(filter, { role, org, selectedOrg }) {
    if (role === ROLES.OWNER) {
        return selectedOrg ? { ...filter, ownerId: new mongoose.Types.ObjectId(selectedOrg) } : filter
    }
    return { ...filter, ownerId: new mongoose.Types.ObjectId(org) }
}

export function checkPayloadFields({
    location,
    health,
    level,
    sensorOk,
    battery,
    weight,
    message,
    lastAwakeSeconds,
}, { hasFillSensor = true } = {}) {
    const valid = ["good", "warning", "critical"];
    if (
        !Array.isArray(location) ||
        location.length !== 2 ||
        typeof location[0] !== "number" ||
        typeof location[1] !== "number" ||
        !Number.isFinite(location[0]) ||
        !Number.isFinite(location[1]) ||
        location[0] < -90 ||
        location[0] > 90 ||
        location[1] < -180 ||
        location[1] > 180
    ) return false;
    if (!valid.includes(health)) return false
    // Without a fill sensor (a gateway) the level fields are ignored, not checked.
    if (hasFillSensor) {
        if (sensorOk !== undefined && typeof sensorOk !== "boolean") return false
        if (sensorOk === false) {
            if (level !== undefined && level !== null) return false
        } else if (typeof level !== "number" || level < 0 || level > 100) {
            return false
        }
    }
    if (typeof battery !== "number" || battery < 0 || battery > 100) return false
    if (typeof weight !== "number") return false
    if (message !== undefined && (typeof message !== "string" || message.length > REPORT_MESSAGE_MAX_LENGTH)) return false
    if (lastAwakeSeconds !== undefined &&
        (!Number.isInteger(lastAwakeSeconds) ||
            lastAwakeSeconds < 1 || lastAwakeSeconds > MAX_LAST_AWAKE_SECONDS)) return false

    return true;
}
