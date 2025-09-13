import { validateToken } from "../utils/helpers.js";

export function authToken(req, res, next) {
    const accessToken = req.cookies?.accessToken
    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthenticated user' })
    }
    try {
        const data = validateToken(accessToken)
        if (!data) return res.status(401).json({ message: 'Invalid or expired token' });

        if (data.status !== 'active') return res.status(401).json({ message: 'User pending activation or user is restricted, please contect our support' });
        req.user = data
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

export function resetToken(req, res, next) {
    const resetToken = req.cookies?.resetToken
    if (!resetToken) {
        return res.status(403).json({ message: 'You are not allowed to do this action' })
    }
    try {
        const data = validateToken(resetToken)
        if (!data) return res.status(401).json({ message: 'Invalid or expired token' });
        req.reset = data
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

export function authRole(allowedRole = []) {
    return (req, res, next) => {
        if (!req?.user) {
            return res.status(401).json({ message: 'Unauthenticated user' })
        }
        const { role } = req.user
        if (!role) {
            return res.status(403).json({ message: "Missing role in token" });
        }
        if (!allowedRole.includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    }
}

