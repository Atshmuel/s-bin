import cron from "node-cron";
import { binLogModel } from "../models/models.js";
import { sendEmail } from "../../utils/mailService.js";
import { getOrgAdmins, innerGetTemplateByTemplateId } from "../service/sharedService.js";

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
                            { battery: { $lte: 20 } },
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
                    const { textTemplate, htmlTemplate, email: senderEmail, subject } = await innerGetTemplateByTemplateId('notifyCriticalBins');
                    let localHtml = htmlTemplate.replaceAll('{{criticalCount}}', reportBins.length);
                    localHtml = localHtml.replaceAll('{{name}}', " " + user.name);
                    let localText = textTemplate.replaceAll('{{criticalCount}}', reportBins.length);
                    localText = localText.replaceAll('{{name}}', " " + user.name);

                    await sendEmail(senderEmail, user.email, subject, localText, localHtml);
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

/* testable function to run the daily check manually
export const runDailyBinCheck = async () => {
    console.log("Starting manual/daily check...");
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
                        { battery: { $lte: 20 } },
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
                const { textTemplate, htmlTemplate, email: senderEmail, subject } = await innerGetTemplateByTemplateId('notifyCriticalBins');
                let localHtml = htmlTemplate.replaceAll('{{criticalCount}}', reportBins.length);
                localHtml = localHtml.replaceAll('{{name}}', " " + user.name);
                let localText = textTemplate.replaceAll('{{criticalCount}}', reportBins.length);
                localText = localText.replaceAll('{{name}}', " " + user.name);

                await sendEmail(senderEmail, user.email, subject, localText, localHtml);
                console.log(`Email sent to ${user.email}`);
            } catch (err) {
                console.error(`[Cron] Error sending daily bins status report to ${user.email}:`, err);
            }
        }

        console.log("Emails sent for all relevant orgs");

    } catch (err) {
        console.error("[Cron] Error sending daily bins status report:", err);
    }
};
*/