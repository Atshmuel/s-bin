import mongoose from "mongoose";
import { binModel, organizationModel, orgStatModel } from "../models/models.js";
import { readingsByBin } from "./readingsService.js";
import { organizationTimeZone } from "./routeService.js";
import { BINS_ONLY_FILTER } from "../../utils/helpers.js";
import { daysBetween, detectCollections, rangeStart } from "../../utils/analytics.js";
import { collectionKg } from "../../utils/costs.js";
import { dayStartEpoch } from "../../utils/deviceSchedule.js";
import {
    DAY_MS, ROLES, STATS_CHUNK_DAYS, STATS_DAYS, STATS_LOOKBACK_MS, STATS_REFRESH_MS, STATS_SETTLE_MS,
} from "../../utils/constants.js";

// Each organization's days in numbers (orgstats), so the analytics read a
// document a day instead of every report: filled when missing, computed again
// while a day may still change, and read by range.

const dayStart = (day, timeZone) => new Date(dayStartEpoch(day, timeZone) * 1000);
const nextDay = day => new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);

// The organizations in the user's scope (an owner's picked one, or all of
// them; anyone else's own), hydrated so ones saved before a setting existed
// get its default.
export async function scopedOrganizations({ role, org, selectedOrg }, projection) {
    const query = role === ROLES.OWNER ? (selectedOrg ? { _id: selectedOrg } : {}) : { _id: org };
    const organizations = await organizationModel.find(query, { ...projection, depot: 1 });
    return organizations.map(organization => organization.toObject());
}

// Days in numbers from the bins' readings (per bin, oldest first): each day
// ({ day, start, end }) counts the emptyings within it and the bins that
// reported in it. Pure.
export function summarizeDays(readingsPerBin, days) {
    const summaries = days.map(({ day }) => ({
        day, collections: 0, fullnessBeforeSum: 0, fullnessBeforeCount: 0,
        weighedKg: 0, weighedCollections: 0, estimatedKg: 0, reportingBins: 0,
    }));
    const indexAt = at => days.findIndex(({ start, end }) => at >= start && at < end);
    for (const readings of readingsPerBin) {
        const reportedOn = new Set(readings.map(reading => indexAt(reading.at)).filter(index => index >= 0));
        for (const index of reportedOn) summaries[index].reportingBins++;
        for (const collection of detectCollections(readings)) {
            const index = indexAt(collection.at);
            if (index < 0) continue;
            const summary = summaries[index];
            summary.collections++;
            if (collection.fullnessBefore !== null) {
                summary.fullnessBeforeSum += collection.fullnessBefore;
                summary.fullnessBeforeCount++;
            }
            const { kg, isEstimate } = collectionKg(collection);
            if (isEstimate) summary.estimatedKg += kg;
            else {
                summary.weighedKg += kg;
                summary.weighedCollections++;
            }
        }
    }
    return summaries;
}

// Computes and saves an organization's consecutive local days.
async function computeDays(orgId, days, timeZone, binIds) {
    const bounds = days.map(day => ({ day, start: dayStart(day, timeZone), end: dayStart(nextDay(day), timeZone) }));
    const since = new Date(bounds[0].start.getTime() - STATS_LOOKBACK_MS);
    const readings = await readingsByBin(binIds, since, bounds.at(-1).end);
    const computedAt = new Date();
    const summaries = summarizeDays(readings.values(), bounds);
    await orgStatModel.bulkWrite(summaries.map(summary => ({
        updateOne: {
            filter: { orgId, day: summary.day },
            update: { $set: { ...summary, timeZone, computedAt } },
            upsert: true,
        },
    })), { ordered: false });
}

// Runs of consecutive days, at most STATS_CHUNK_DAYS each, so a fill reads a
// bounded stretch of reports at a time.
function chunks(days) {
    const runs = [];
    for (const day of [...days].sort()) {
        const run = runs.at(-1);
        if (run && run.length < STATS_CHUNK_DAYS && nextDay(run.at(-1)) === day) run.push(day);
        else runs.push([day]);
    }
    return runs;
}

// The days of `days` that need computing: missing, or not settled (computed
// less than STATS_SETTLE_MS after the day ended) and computed over
// STATS_REFRESH_MS ago. Today never settles.
function staleDays(days, stats, timeZone, now) {
    const byDay = new Map(stats.map(stat => [stat.day, stat]));
    return days.filter(day => {
        const stat = byDay.get(day);
        if (!stat) return true;
        const settledAt = dayStart(nextDay(day), timeZone).getTime() + STATS_SETTLE_MS;
        return stat.computedAt.getTime() < settledAt && now - stat.computedAt.getTime() > STATS_REFRESH_MS;
    });
}

// Several requests for one organization at once (the analytics page's cards)
// share one fill.
const filling = new Map();

// An organization's local days in numbers, computing those missing or stale
// first. `days` are dates ("YYYY-MM-DD"); returns a Map of day to its numbers.
export async function organizationDays(organization, days, { now = Date.now() } = {}) {
    const orgId = new mongoose.Types.ObjectId(organization._id);
    const timeZone = await organizationTimeZone(organization);
    const read = () => orgStatModel.find({ orgId, day: { $in: days } }).lean();
    let stats = await read();
    const stale = staleDays(days, stats, timeZone, now);
    if (stale.length) {
        const key = `${orgId}:${stale.join(",")}`;
        if (!filling.has(key)) {
            filling.set(key, (async () => {
                const bins = await binModel.find({ ...BINS_ONLY_FILTER, ownerId: orgId }, { _id: 1 }).lean();
                for (const run of chunks(stale)) await computeDays(orgId, run, timeZone, bins.map(bin => bin._id));
            })().finally(() => filling.delete(key)));
        }
        await filling.get(key);
        stats = await read();
    }
    return new Map(stats.map(stat => [stat.day, stat]));
}

// The last `count` local days, oldest first, ending today in the time zone.
export function lastDays(count, timeZone, now = Date.now()) {
    return daysBetween(rangeStart(count - 1, now), timeZone, now);
}

// Keeps every organization's last STATS_DAYS ready (the hourly job), so a
// viewer rarely waits for a fill; one that fails does not stop the others.
export async function refreshAllStats(now = Date.now()) {
    const organizations = await organizationModel.find({}, { name: 1, depot: 1 }).lean();
    for (const organization of organizations) {
        try {
            await organizationDays(organization, lastDays(STATS_DAYS, await organizationTimeZone(organization), now), { now });
        } catch (error) {
            console.error(`[Stats] Error refreshing ${organization.name}:`, error);
        }
    }
}

