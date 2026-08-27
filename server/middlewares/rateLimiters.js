import { rateLimit } from 'express-rate-limit'

/**
 * Rate limiters.
 *
 * `express-rate-limit` was already a dependency but was never imported anywhere,
 * so every endpoint — including login and OTP verification — accepted unlimited
 * attempts. A 6-digit OTP with no attempt cap is brute-forceable.
 *
 * These key on client IP, which only works because `trust proxy` is set in
 * app.js and nginx now forwards X-Forwarded-For. Without both, every request
 * looks like it comes from the nginx container and the limit applies globally
 * to all users at once.
 */

const jsonMessage = (message) => ({ message })

/** Broad safety net for the whole API. Generous enough not to affect normal use. */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonMessage('Too many requests, please try again later'),
})

/**
 * Strict limiter for credential-handling endpoints: login, register, forgot
 * password and OTP verification. This is the IP-side defence; `verifyRecoveryCode`
 * additionally caps attempts per account so rotating IPs does not help.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonMessage('Too many attempts, please try again in a few minutes'),
})
