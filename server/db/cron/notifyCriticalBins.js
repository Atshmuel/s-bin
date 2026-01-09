import cron from "node-cron";
import { binLogModel } from "../models/models.js";
import { sendEmail } from "../../utils/mailService.js";
import { innerGetTemplateByTemplateId } from "../service/sharedService.js";

if (!global.dailyBinsStatusCronStarted) {
    global.dailyBinsStatusCronStarted = true;
    console.log("dailyBinsStatusCronStarted");

    cron.schedule("0 8 * * *", async () => {
        try {
            const reportBins = await binLogModel.aggregate([
                { $sort: { createdAt: -1 } },

                {
                    $group: {
                        _id: "$binId",
                        lastLog: { $first: "$$ROOT" }
                    }
                },

                { $replaceRoot: { newRoot: "$lastLog" } },

                {
                    $match: {
                        $or: [
                            { newLevel: { $gte: 80 } },
                            { health: "critical" }
                        ]
                    }
                },

                {
                    $project: {
                        binId: 1,
                        newLevel: 1,
                        battery: 1,
                        health: 1,
                        createdAt: 1
                    }
                }
            ]);

            if (reportBins.length === 0) return;

            const { textTemplate, htmlTemplate, email: senderEmail, subject } = await innerGetTemplateByTemplateId('notifyCriticalBins')
            let localHtml = htmlTemplate.replaceAll('{{criticalCount}}', reportBins.length)
            let localText = textTemplate.replaceAll('{{criticalCount}}', reportBins.length)
            await sendEmail(senderEmail, "adva1230@gmail.com", subject, localText, localHtml);

        } catch (err) {
            console.error("[Cron] Error sending daily bins status report:", err);
        }
    });
}
