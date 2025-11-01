import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export async function generateOTP(expiryMinutes = 5, length = 6) {
    let otp = '';
    const digits = '0123456789';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { otp, expiresAt, expiryMinutes };
}

export function generateVerificationLink(token) {
    if (!token) return null
    return `${process.env.CLIENT_BASE_URL}/user/verify?token=${token}`
}

export async function hashPassword(password, rounds = 10) {
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

export function generateRandomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

export function appendFilter(baseQuery, condition, field, value) {
    return condition ? { ...baseQuery, [field]: value } : baseQuery
}

export function checkPayloadFields({ location, health, level, battery }) {
    const valid = ["good", "warning", "critical"];
    if (!Array.isArray(location) || location.length !== 2) return false;
    if (!valid.includes(health)) return false
    if (typeof level !== "number" || level < 0 || level > 100) return false
    if (typeof battery !== "number" || battery < 0 || battery > 100) return false

    return true;
}