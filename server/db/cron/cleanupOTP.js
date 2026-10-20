import cron from "node-cron";
import { userModel } from "../models/models.js"
import { CRON_SCHEDULES } from '../../utils/constants.js'

if (!global.otpCronStarted) {// To prevent multi crons on OTPs
    global.otpCronStarted = true;
    console.log("otpCronStarted");
    cron.schedule(CRON_SCHEDULES.otpCleanup, async () => {
        try {
            const now = new Date();
            const result = await userModel.updateMany(
                { "recoveryCode.expiresAt": { $lt: now } },
                { $unset: { recoveryCode: "" } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Cron] Cleaned up ${result.modifiedCount} expired OTPs`);
            }
        } catch (err) {
            console.error("[Cron] Error cleaning expired OTPs:", err);
        }
    })
}