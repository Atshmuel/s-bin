import cron from "node-cron";
import { binLogModel } from "../models/models.js";
import { sendEmail, buildEmailHtml } from "../../utils/mailService.js";

if (!global.dailyBinsStatusCronStarted) {
    global.dailyBinsStatusCronStarted = true;

    cron.schedule("0 8 * * *", async () => {
        console.log("Cron started");
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

            console.log("Report bins:", reportBins);

            const html = buildEmailHtml(reportBins);

            await sendEmail(
                process.env.EMAIL_USER,
                "adva1230@gmail.com",
                "Daily Bins Status Report",
                "",
                html
            );

            console.log(`[Cron] Daily bins status report sent (${reportBins.length} bins)`);

        } catch (err) {
            console.error("[Cron] Error sending daily bins status report:", err);
        }
    });
}
