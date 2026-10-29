import { binLogModel } from "../models/models.js";

// A device's sensor readings (its reports), as the analytics and the route
// planner read them.
export const READINGS_FILTER = Object.freeze({ type: "log", source: "sensor" });
// Logs that name a problem: fault codes, or an older firmware's English message.
export const WITH_PROBLEMS_FILTER = Object.freeze({
    $or: [{ "faults.0": { $exists: true } }, { message: { $exists: true, $ne: null } }],
});

// Readings of many bins at once, from `since` (until `until`, when given),
// grouped per bin and sorted oldest first.
export async function readingsByBin(binIds, since, until = null) {
    const groups = await binLogModel.aggregate([
        { $match: { binId: { $in: binIds }, ...READINGS_FILTER, createdAt: { $gte: since, ...(until ? { $lt: until } : {}) } } },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$binId',
                readings: { $push: { at: '$createdAt', level: '$newLevel', weight: '$weight', battery: '$battery' } },
            },
        },
    ]);
    return new Map(groups.map(group => [String(group._id), group.readings.map(reading => ({
        at: reading.at,
        level: reading.level ?? null,
        weight: reading.weight ?? null,
        battery: reading.battery ?? null,
    }))]));
}
