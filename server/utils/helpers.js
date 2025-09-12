import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function generateOTP(expiryMinutes = 5, length = 6) {
    let otp = '';
    const digits = '0123456789';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { otp, expiresAt, expiryMinutes };
}

export async function hashPassword(password) {
    if (!password || !password.length) return null
    try {
        const hashed = await bcrypt.hash(password, 10)
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

export function appendFilter(baseQuery, condition, field, value) {
    return condition ? { ...baseQuery, [field]: value } : baseQuery
}