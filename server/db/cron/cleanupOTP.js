import cron from "node-cron";
import { userModel } from "../models/models.js"

if (!global.cronStarted) {// To prevent multi crons on OTPs
    global.cronStarted = true;
    cron.schedule('* * * * *', async () => {
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