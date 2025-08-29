import jwt from "jsonwebtoken"

export function authCookie(req, res, next) {
    const token = req.cookies?.token
    if (!token) {
        return res.status(401).json({ message: 'Unauthenticated user' })
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_HASHED_TOKEN);
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
            return res.status(403).json({ message: "Access denieds" });
        }

        next();
    }

}