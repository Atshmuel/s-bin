import cron from "node-cron";
import { binModel, binLogModel } from "../models/models.js";

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const getHealthFromLevel = (level) => {
    if (level < 60) return "good";
    if (level < 75) return "warning";
    return "critical";
};

const getSeverityFromHealth = (health) => {
    if (health === "critical") return "critical";
    if (health === "warning") return "warning";
    return "info";
};

const getMessageFromHealth = (health) => {
    if (health === "critical") return "Immediate attention required, notify maintenance team.";
    if (health === "warning") return "Check soon and schedule maintenance.";
    return null;
};

async function generateLogsForAllBins() {
    try {
        const bins = await binModel.find({});

        if (!bins.length) {
            console.log("[Cron] No bins found in DB");
            return;
        }

        console.log(`[Cron] Generating logs for ${bins.length} bins...`);

        for (const bin of bins) {
            const level = randomInt(0, 100);
            const health = getHealthFromLevel(level);
            const severity = getSeverityFromHealth(health);
            const message = getMessageFromHealth(health);
            const battery = Math.max(0, bin.status.battery - randomInt(0, 2));

            if (battery === 0) {
                bin.status.battery = 100
            }; // Simulate battery replacement

            // Create log entry
            const logData = {
                binId: bin._id,
                location: bin.location.coordinates,
                health,
                oldLevel: bin.status.level,
                newLevel: level,
                battery,
                severity,
                type: "log",
                source: "sensor",
            };

            if (message) {
                logData.message = message;
            }

            await binLogModel.create(logData);

            // Update bin status
            bin.status.updatedAt = new Date();
            bin.status.health = health;
            bin.status.level = level;
            bin.status.battery = battery;

            if (message) {
                bin.maintenance.notes = `Auto-generated log on ${new Date().toLocaleString()}, message: ${message}`;
            }

            await bin.save();
        }

        console.log(`[Cron] Successfully generated logs for ${bins.length} bins at ${new Date().toLocaleString()}`);
    } catch (error) {
        console.error("[Cron] Error generating bin logs:", error);
    }
}

// Prevent duplicate cron jobs on hot reload
if (!global.generateBinLogsCronStarted) {
    global.generateBinLogsCronStarted = true;
    console.log("[Cron] generateBinLogs cron started - runs every hour");

    // UPDATED: Runs every 4 hours (at minute 0 of hours 0, 4, 8, 12, etc.)
    cron.schedule("0 */4 * * *", async () => {
        console.log(`[Cron] Running generateBinLogs at ${new Date().toLocaleString()}`);
        await generateLogsForAllBins();
    });
}

// Export for manual execution if needed
export { generateLogsForAllBins };
