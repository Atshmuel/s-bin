import cron from "node-cron";
import { binLogModel } from "../models/models.js";
import { getOrgAdmins, sendTemplateEmail } from "../service/sharedService.js";
import { BATTERY_CRITICAL_PERCENT, FULLNESS_CRITICAL_PERCENT, WEIGHT_REFERENCE_KG } from "../../utils/constants.js";

// A log's fullness: its fill level or its weight (kg) against the reference,
// whichever is higher; null when it has neither.
const LOG_FULLNESS = {
    $max: ['$newLevel', { $cond: [{ $isNumber: '$weight' }, { $multiply: [{ $divide: ['$weight', WEIGHT_REFERENCE_KG] }, 100] }, null] }],
};

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
                            { $expr: { $gte: [LOG_FULLNESS, FULLNESS_CRITICAL_PERCENT] } },
                            { battery: { $lte: BATTERY_CRITICAL_PERCENT } },
                            { health: "critical" }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "bins",
                        localField: "binId",
                        foreignField: "_id",
                        as: "binDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$binDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        binId: 1,
                        newLevel: 1,
                        battery: 1,
                        health: 1,
                        createdAt: 1,
                        orgId: "$binDetails.ownerId", //The organization that owns the bin
                    }
                }
            ]);

            if (reportBins.length === 0) {
                console.log("No critical bins found.");
                return;
            }

            const orgs = [...new Set(reportBins.map(bin => bin?.orgId))];

            const users = await getOrgAdmins(orgs);

            if (users.length === 0) return;

            for (const user of users) {
                try {
                    await sendTemplateEmail('notifyCriticalBins', user.email, {
                        criticalCount: reportBins.length,
                        name: " " + user.name,
                    });
                    console.log(`Email sent to ${user.email}`);
                } catch (err) {
                    console.error(`[Cron] Error sending daily bins status report to ${user.email}:`, err);
                }
            }

            console.log("Emails sent for all relevant orgs");

        } catch (err) {
            console.error("[Cron] Error sending daily bins status report:", err);
        }
    });
}
