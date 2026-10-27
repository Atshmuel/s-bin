import { binModel } from "../models/models.js";
import { readingsByBin } from "./readingsService.js";
import { BINS_ONLY_FILTER } from "../../utils/helpers.js";
import { fillRatePerDay, rangeStart } from "../../utils/analytics.js";
import { FILL_RATE_CHUNK_BINS, FILL_RATE_WINDOW_DAYS } from "../../utils/constants.js";

// Each bin keeps how fast it fills (status.fillRatePerDay) and when that was
// worked out (status.fillRateAt), so the forecasts (the bins due soon, the
// nightly plan) read the bins instead of FILL_RATE_WINDOW_DAYS of every bin's
// reports. Its report updates it; a rate older than the bin's last report
// (one that came before this, or through a server without it) is worked out
// again when read, and by the hourly job.

// The fields a caller reads the bins with, for withFreshFillRates.
export const FILL_RATE_FIELDS = Object.freeze({ "status.updatedAt": 1, "status.fillRatePerDay": 1, "status.fillRateAt": 1 });

// One bin's fill rate from its recent reports (its new one included).
export async function binFillRate(binId, now = Date.now()) {
    const readings = await readingsByBin([binId], rangeStart(FILL_RATE_WINDOW_DAYS, now));
    return fillRatePerDay(readings.get(String(binId)) ?? []);
}

const isStale = bin => !bin.status?.fillRateAt || (bin.status.updatedAt && bin.status.fillRateAt < bin.status.updatedAt);

// The bins' fill rates (bins read with FILL_RATE_FIELDS), working out and
// saving the stale ones first, FILL_RATE_CHUNK_BINS at a time. A Map of bin
// id to its rate (% a day, or null).
export async function withFreshFillRates(bins, now = Date.now()) {
    const rates = new Map(bins.map(bin => [String(bin._id), bin.status?.fillRatePerDay ?? null]));
    const stale = bins.filter(isStale);
    for (let i = 0; i < stale.length; i += FILL_RATE_CHUNK_BINS) {
        const chunk = stale.slice(i, i + FILL_RATE_CHUNK_BINS);
        const readings = await readingsByBin(chunk.map(bin => bin._id), rangeStart(FILL_RATE_WINDOW_DAYS, now));
        const fillRateAt = new Date();
        const updates = chunk.map(bin => {
            const rate = fillRatePerDay(readings.get(String(bin._id)) ?? []);
            rates.set(String(bin._id), rate);
            return {
                updateOne: {
                    filter: { _id: bin._id },
                    update: { $set: { "status.fillRatePerDay": rate, "status.fillRateAt": fillRateAt } },
                },
            };
        });
        await binModel.bulkWrite(updates, { ordered: false });
    }
    return rates;
}

// The stale fill rates of the bins a filter matches, found by the database
// (usually none), worked out and saved.
export async function refreshStaleFillRates(filter = BINS_ONLY_FILTER, now = Date.now()) {
    const stale = await binModel.find({
        ...filter,
        $or: [{ "status.fillRateAt": null }, { $expr: { $lt: ["$status.fillRateAt", "$status.updatedAt"] } }],
    }, FILL_RATE_FIELDS).lean();
    await withFreshFillRates(stale, now);
}

// Every bin's stale fill rate (the hourly job).
export async function refreshFillRates(now = Date.now()) {
    await refreshStaleFillRates(BINS_ONLY_FILTER, now);
}
