import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { registerDeviceOverHttps } from "../db/controllers/deviceController.js";
import { DEVICE_REGISTRATION_FAILURE_LIMIT, RATE_LIMIT_WINDOW_MS } from "../utils/constants.js";

// Devices themselves (no user session).
export const deviceRouter = Router();

// Wrong codes are limited per address; successful registrations are not counted.
const registrationLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: DEVICE_REGISTRATION_FAILURE_LIMIT,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many registration attempts, please try again later." },
});

deviceRouter.post("/register", registrationLimiter, registerDeviceOverHttps);
