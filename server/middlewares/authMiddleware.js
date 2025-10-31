import { binModel, userModel } from "../db/models/models.js";
import { validateToken } from "../utils/helpers.js";


export function authBinWithRoleFallback(allowedRoles = []) {
    return async (req, res, next) => {
        const authBearer = req.headers.authorization
        if (authBearer?.startsWith('Bearer ')) {
            const deviceKey = authBearer.split(" ")[1];
            try {
                const bin = await binModel.findOne({ deviceKey })
                if (!bin) {
                    return res.status(401).json({ message: "Unauthorized device" });
                }
                req.bin = bin
                return next();
            } catch (error) {
                console.error('Failed to authorize the device');
                return res.status(500).json({ message: "Failed to authorize the device" });
            }
        }

        try {
            await authTokenPromise(req, res)
            authRole(allowedRoles)(req, res, next)
        }
        catch (error) {
            console.error(error);
        }
    }

}


export async function authToken(req, res, next) {
    const accessToken = req.cookies?.accessToken
    if (!accessToken)
        return res.status(401).json({ message: 'Unauthenticated user' })

    try {
        const data = validateToken(accessToken)
        if (!data) return res.status(401).json({ message: 'Invalid or expired token' });

        const user = await userModel.findById(data.id);
        if (!user) return res.status(401).json({ message: 'User not found' });

        if (data.tokenVersion !== user.tokenVersion)
            return res.status(401).json({ message: "Unauthorized" });

        if (user.status !== 'active')
            return res.status(401).json({ message: 'User pending activation or user is restricted, please contect our support' });

        req.user = {
            id: user._id.toString(),
            role: user.role,
            name: user.name,
            status: user.status,
        }
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

export async function authTokenPromise(req, res) {
    const accessToken = req.cookies?.accessToken
    if (!accessToken)
        return res.status(401).json({ message: 'Unauthenticated user' })

    try {
        const data = validateToken(accessToken)
        if (!data) return res.status(401).json({ message: 'Invalid or expired token' });

        const user = await userModel.findById(data.id);
        if (!user) return res.status(401).json({ message: 'User not found' });

        if (data.tokenVersion !== user.tokenVersion)
            return res.status(401).json({ message: "Unauthorized" });

        if (user.status !== 'active')
            return res.status(401).json({ message: 'User pending activation or user is restricted, please contect our support' });

        req.user = {
            id: user._id.toString(),
            role: user.role,
            name: user.name,
            status: user.status,
        }
        return true
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

export function authRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req?.user) {
            return res.status(401).json({ message: 'Unauthenticated user' })
        }
        const { role } = req.user
        if (!role) {
            return res.status(403).json({ message: "Missing role in token" });
        }
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    }
}

export async function authDevice(req, res, next) {
    const authBearer = req.headers.authorization
    const mac = req.headers["x-device-mac"];
    if (!authBearer?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized device" });
    }
    const token = authBearer.split(" ")[1];
    if (!token || !mac) {
        return res.status(401).json({ message: "Unauthorized device" });
    }

    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    if (!macRegex.test(mac)) {
        return res.status(400).json({ message: "Invalid MAC address format" });
    }
    try {

        const device = await binModel.findOne({ deviceKey: token, macAddress: mac });
        if (!exist) {
            return res.status(401).json({ message: "Unauthorized device" });
        }
        req.device = device
        next();
    } catch (error) {
        console.error('Failed to authorize the device');
        return res.status(500).json({ message: "Failed to authorize the device" });
    }

}


