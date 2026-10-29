import cron from "node-cron";
import { binLogModel, binModel, deviceInstructionModel } from "../models/models.js"
import { INSTRUCTION_RETENTION_MS, CRON_SCHEDULES } from "../../utils/constants.js"

const FINISHED_STATUSES = ["completed", "failed", "cancelled"];

// A device checks for instructions on every report, so a request still pending
// after the retention period means the bin has not checked in for days.
async function expireStalePendingInstructions(cutoff) {
    const stale = await deviceInstructionModel.find(
        { status: "pending", createdAt: { $lt: cutoff } },
        { binId: 1, type: 1 }
    ).lean();
    if (stale.length === 0) return;

    await deviceInstructionModel.updateMany(
        { _id: { $in: stale.map(instruction => instruction._id) }, status: "pending" },
        { $set: { status: "failed", result: "expired", completedAt: new Date() } }
    );

    const typesByBin = new Map();
    for (const { binId, type } of stale) {
        const key = binId.toString();
        typesByBin.set(key, [...(typesByBin.get(key) ?? []), type]);
    }

    const bins = await binModel.find({ _id: { $in: [...typesByBin.keys()] } });
    for (const bin of bins) {
        const types = [...new Set(typesByBin.get(bin._id.toString()))];
        const level = bin.status.levelValid === false ? null : bin.status.level;
        await binLogModel.create({
            binId: bin._id,
            type: "error",
            severity: "warning",
            source: "system",
            health: bin.status.health,
            oldLevel: level,
            newLevel: level,
            battery: bin.status.battery,
            weight: bin.status.weight,
            faults: [{ code: "instructions_expired", types }],
        });
    }
    console.log(`[Cron] Expired ${stale.length} pending device instructions for ${bins.length} bins`);
}

if (!global.deviceInstructionCleanupCronStarted) {// To prevent multi crons on device instructions
    global.deviceInstructionCleanupCronStarted = true;
    console.log("deviceInstructionCleanupCronStarted");

    cron.schedule(CRON_SCHEDULES.instructionCleanup, async () => {
        try {
            const cutoff = new Date(Date.now() - INSTRUCTION_RETENTION_MS);
            await expireStalePendingInstructions(cutoff);

            const result = await deviceInstructionModel.deleteMany({
                status: { $in: FINISHED_STATUSES },
                updatedAt: { $lt: cutoff },
            });
            if (result.deletedCount > 0) {
                console.log(`[Cron] Deleted ${result.deletedCount} finished device instructions`);
            }
        } catch (err) {
            console.error("[Cron] Error cleaning device instructions:", err);
        }
    })
}
