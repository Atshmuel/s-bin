import cron from "node-cron";
import { userModel } from "../models/models.js"

if (!global.activationTokenCronStarted) {// To prevent multi crons on activation token
    global.activationTokenCronStarted = true;
    cron.schedule('0 0 * * *', async () => {
        try {
            const now = new Date();
            const result = await userModel.updateMany(
                { "accountVerification.expiresAt": { $lt: now } },
                { $unset: { accountVerification: "" } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Cron] Cleaned up ${result.modifiedCount} expired verification links`);
            }
        } catch (err) {
            console.error("[Cron] Error cleaning expired verification links:", err);
        }
    })
}