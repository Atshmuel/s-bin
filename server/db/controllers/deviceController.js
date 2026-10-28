import mongoose from "mongoose";
import { organizationModel } from "../models/models.js";
import { registerDevice } from "../service/deviceRegistrationService.js";
import { registrationCodeMatches } from "../../utils/registrationCode.js";

// A new device registers over HTTPS (no user session): its MAC, organization,
// the organization's registration code, its GPS location ([lat, lng]) and
// battery; it gets its device key and first schedule. A wrong code or
// organization is the same 403, so neither can be probed.
export async function registerDeviceOverHttps(req, res) {
    const { mac, orgId, code, location, battery, kind } = req.body ?? {};
    try {
        const org = mongoose.Types.ObjectId.isValid(orgId)
            ? await organizationModel.findById(orgId, { registrationCode: 1 }).lean()
            : null;
        if (!org || !registrationCodeMatches(code, org.registrationCode)) {
            return res.status(403).json({ message: "Unknown organization or wrong registration code." });
        }
        const { status, ...registered } = await registerDevice({ mac, orgId, location, battery, kind });
        if (status === "invalid") return res.status(400).json({ message: "mac, location [lat, lng] and battery (0-100) are required." });
        if (status === "exists") return res.status(409).json({ message: "This device is already registered." });
        if (status !== "registered") return res.status(403).json({ message: "Unknown organization or wrong registration code." });
        return res.status(201).json(registered);
    } catch (error) {
        console.error("HTTPS device registration failed:", error);
        return res.status(500).json({ message: "Registration failed." });
    }
}
