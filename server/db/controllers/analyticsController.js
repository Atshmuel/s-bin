import mongoose from 'mongoose'
import { binLogModel, binModel } from '../models/models.js'
import { BINS_ONLY_FILTER, scopeToOrganization } from '../../utils/helpers.js'
import { getOrgDeviceSettingsShared } from '../service/sharedService.js'
import { DASHBOARD_SECTIONS } from './dashboardController.js'
import {
    ANALYTICS_RANGES_DAYS, BATTERY_BUCKETS, BATTERY_SOON_DAYS, BATTERY_SOON_LIST_LIMIT, BATTERY_TREND_DAYS,
    DEFAULT_RANGE_DAYS, FILL_RATE_WINDOW_DAYS, FULL_SOON_HOURS, FULL_SOON_LIST_LIMIT, FULLNESS_BUCKETS,
    LEAST_RELIABLE_LIMIT, RELIABILITY_DAYS,
} from '../../utils/constants.js'
import {
    HEALTH_CAUSE_NAMES,
    batteryDaysLeft, dayKey, daysBetween, detectCollections, expectedFullAt, fillRatePerDay, fullnessPercent,
    healthCauses, isValidTimeZone, rangeStart, reportReliability, trendPerDay,
} from '../../utils/analytics.js'

// Each section of the bin page and the analytics page is its own request, so
// sections load in parallel and a slow one holds up nothing else. Every
// response is aggregated to what its chart draws; raw logs never leave.

const HOUR_MS = 60 * 60 * 1000;
// Only device reports: maintenance notes and system entries carry no readings.
const READINGS_FILTER = Object.freeze({ type: 'log', source: 'sensor' });

function parseRangeDays(value) {
    const days = Number(value);
    return ANALYTICS_RANGES_DAYS.includes(days) ? days : DEFAULT_RANGE_DAYS;
}

// The viewer's time zone for day buckets on the analytics page (bins in
// several zones share one chart); UTC when the client sends none.
function requestTimeZone(req) {
    return isValidTimeZone(req.query.tz) ? req.query.tz : 'UTC';
}

function toReading(log) {
    return {
        at: log.createdAt,
        level: log.newLevel ?? null,
        weight: log.weight ?? null,
        battery: log.battery ?? null,
    };
}

async function binReadings(binId, since, extraFields = {}) {
    const logs = await binLogModel.find(
        { binId, ...READINGS_FILTER, createdAt: { $gte: since } },
        { createdAt: 1, newLevel: 1, weight: 1, battery: 1, ...extraFields },
    ).sort({ createdAt: 1 }).lean();
    return logs;
}

// Readings of many bins at once, grouped per bin and sorted oldest first.
async function readingsByBin(binIds, since) {
    const groups = await binLogModel.aggregate([
        { $match: { binId: { $in: binIds }, ...READINGS_FILTER, createdAt: { $gte: since } } },
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

function scopedBins(user, filter, projection) {
    return binModel.find(scopeToOrganization(filter, user), projection).lean();
}

// When each device first reported (kept logs only), through the binId index.
async function firstReportTimes(binIds) {
    const firsts = await Promise.all(binIds.map(binId => binLogModel.findOne(
        { binId, ...READINGS_FILTER }, { createdAt: 1 },
    ).sort({ createdAt: 1 }).lean()));
    return new Map(binIds.map((binId, i) => [String(binId), firsts[i]?.createdAt ?? null]));
}

// Report intervals per organization, fetched once each.
async function intervalsByOrg(bins) {
    const orgIds = [...new Set(bins.map(bin => String(bin.ownerId)))];
    const settings = await Promise.all(orgIds.map(orgId => getOrgDeviceSettingsShared(orgId)));
    return new Map(orgIds.map((orgId, i) => [orgId, settings[i].reportIntervalMinutes]));
}

// ---- Bin page: GET /api/bins/:id/analytics/:section ----

async function binFillRate(bin) {
    if (bin.kind === 'gateway') return { applicable: false };
    const readings = (await binReadings(bin._id, rangeStart(FILL_RATE_WINDOW_DAYS))).map(toReading);
    const level = bin.status?.levelValid === false ? null : bin.status?.level ?? null;
    const ratePerDay = fillRatePerDay(readings);
    return {
        applicable: true,
        level,
        ratePerDay,
        expectedFullAt: expectedFullAt(level, ratePerDay),
    };
}

async function binHistory(bin, { days }) {
    const readings = (await binReadings(bin._id, rangeStart(days))).map(toReading);
    return {
        points: readings,
        collections: detectCollections(readings).map(collection => collection.at),
    };
}

async function binCollections(bin, { days }) {
    const readings = (await binReadings(bin._id, rangeStart(days))).map(toReading);
    return { collections: detectCollections(readings).reverse() };
}

async function binBattery(bin, { days }) {
    const timeZone = bin.timezone || 'UTC';
    const [daily, recent] = await Promise.all([
        binLogModel.aggregate([
            { $match: { binId: bin._id, ...READINGS_FILTER, createdAt: { $gte: rangeStart(days) } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: timeZone } },
                    battery: { $avg: '$battery' },
                    awakeSeconds: { $avg: '$lastAwakeSeconds' },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        binReadings(bin._id, rangeStart(BATTERY_TREND_DAYS)),
    ]);
    const ratePerDay = trendPerDay(recent.map(toReading), 'battery');
    return {
        daily: daily.map(day => ({
            day: day._id,
            battery: Math.round(day.battery),
            awakeSeconds: day.awakeSeconds === null ? null : Math.round(day.awakeSeconds),
        })),
        battery: bin.status?.battery ?? null,
        ratePerDay,
        daysLeft: batteryDaysLeft(bin.status?.battery, ratePerDay),
    };
}

async function binConnection(bin, { days }) {
    const logs = await binReadings(bin._id, rangeStart(days), { connection: 1, rssi: 1, hops: 1 });
    return {
        points: logs.map(log => ({
            at: log.createdAt,
            via: log.connection ?? null,
            rssi: log.rssi ?? null,
            hops: log.hops ?? null,
        })),
    };
}

async function binReliability(bin) {
    const now = new Date();
    const [{ reportIntervalMinutes }, firstReports, counts] = await Promise.all([
        getOrgDeviceSettingsShared(bin.ownerId),
        firstReportTimes([bin._id]),
        Promise.all(RELIABILITY_DAYS.map(days => binLogModel.countDocuments({
            binId: bin._id, ...READINGS_FILTER, createdAt: { $gte: rangeStart(days) },
        }))),
    ]);
    return Object.fromEntries(RELIABILITY_DAYS.map((days, i) => [
        `days${days}`,
        reportReliability(counts[i], rangeStart(days), now, reportIntervalMinutes, firstReports.get(String(bin._id))),
    ]));
}

const BIN_SECTIONS = {
    'fill-rate': binFillRate,
    history: binHistory,
    collections: binCollections,
    battery: binBattery,
    connection: binConnection,
    reliability: binReliability,
};

export async function getBinAnalytics(req, res) {
    const section = BIN_SECTIONS[req.params.section];
    if (!section) return res.status(404).json({ message: `Unknown analytics section '${req.params.section}'.` });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: `Invalid id: '${req.params.id}'` });
    }
    try {
        const bin = await binModel.findOne(
            scopeToOrganization({ _id: new mongoose.Types.ObjectId(req.params.id) }, req.user),
            { macAddress: 0, deviceKey: 0 },
        ).lean();
        if (!bin) return res.status(404).json({ message: 'Bin not found.' });
        res.status(200).json(await section(bin, { days: parseRangeDays(req.query.range) }));
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to load the analytics.' });
    }
}

// ---- Analytics page: GET /api/overviews/:section ----

async function fullSoon(user) {
    const now = Date.now();
    const bins = await scopedBins(user, { ...BINS_ONLY_FILTER, 'status.levelValid': { $ne: false } },
        { binName: 1, 'status.level': 1 });
    const readings = await readingsByBin(bins.map(bin => bin._id), rangeStart(FILL_RATE_WINDOW_DAYS));
    const forecasts = bins.map(bin => {
        const ratePerDay = fillRatePerDay(readings.get(String(bin._id)) ?? []);
        return {
            _id: bin._id,
            binName: bin.binName,
            level: bin.status?.level ?? null,
            ratePerDay,
            expectedFullAt: expectedFullAt(bin.status?.level, ratePerDay, now),
        };
    }).filter(forecast => forecast.expectedFullAt !== null);
    const lastHours = FULL_SOON_HOURS[FULL_SOON_HOURS.length - 1];
    const soon = forecasts
        .filter(forecast => forecast.expectedFullAt.getTime() <= now + lastHours * HOUR_MS)
        .sort((a, b) => a.expectedFullAt - b.expectedFullAt);
    return {
        counts: Object.fromEntries(FULL_SOON_HOURS.map(hours => [
            `within${hours}h`,
            soon.filter(forecast => forecast.expectedFullAt.getTime() <= now + hours * HOUR_MS).length,
        ])),
        bins: soon.slice(0, FULL_SOON_LIST_LIMIT),
    };
}

function bucketCounts(values, buckets) {
    return buckets.map(([from, to]) => ({
        from,
        to: Math.min(to, 100),
        count: values.filter(value => value >= from && value < to).length,
    }));
}

async function fullnessDistribution(user) {
    const bins = await scopedBins(user, { ...BINS_ONLY_FILTER },
        { 'status.level': 1, 'status.levelValid': 1, 'status.weight': 1, 'status.scale': 1 });
    const values = bins.map(bin => fullnessPercent(
        bin.status?.levelValid === false ? null : bin.status?.level,
        bin.status?.scale === 'ok' ? bin.status?.weight : null,
    ));
    const known = values.filter(value => value !== null);
    return { buckets: bucketCounts(known, FULLNESS_BUCKETS), unknown: values.length - known.length };
}

// Every collection in the range across the user's bins, with its day.
async function orgCollections(user, days, timeZone) {
    const bins = await scopedBins(user, { ...BINS_ONLY_FILTER }, { _id: 1 });
    const start = rangeStart(days);
    const readings = await readingsByBin(bins.map(bin => bin._id), start);
    const collections = [...readings.values()].flatMap(binReadingsList => detectCollections(binReadingsList));
    return { start, collections: collections.map(collection => ({ ...collection, day: dayKey(collection.at, timeZone) })) };
}

function average(values) {
    return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

async function collectionsOverview(user, { days, timeZone }) {
    const { start, collections } = await orgCollections(user, days, timeZone);
    const fullness = list => average(list.map(c => c.fullnessBefore).filter(value => value !== null));
    return {
        daily: daysBetween(start, timeZone).map(day => {
            const ofDay = collections.filter(collection => collection.day === day);
            return { day, count: ofDay.length, avgFullnessBefore: fullness(ofDay) };
        }),
        total: collections.length,
        avgFullnessBefore: fullness(collections),
    };
}

async function wasteOverview(user, { days, timeZone }) {
    const { start, collections } = await orgCollections(user, days, timeZone);
    const weighed = collections.filter(collection => collection.kgRemoved !== null);
    const round = kg => Math.round(kg * 10) / 10;
    return {
        daily: daysBetween(start, timeZone).map(day => ({
            day,
            kg: round(weighed.filter(c => c.day === day).reduce((sum, c) => sum + c.kgRemoved, 0)),
        })),
        totalKg: round(weighed.reduce((sum, collection) => sum + collection.kgRemoved, 0)),
        weighedCollections: weighed.length,
    };
}

async function batteryOverview(user) {
    // Every device has a battery, gateways included.
    const bins = await scopedBins(user, {}, { binName: 1, kind: 1, 'status.battery': 1 });
    const readings = await readingsByBin(bins.map(bin => bin._id), rangeStart(BATTERY_TREND_DAYS));
    const soon = bins.map(bin => ({
        _id: bin._id,
        binName: bin.binName,
        kind: bin.kind,
        battery: bin.status?.battery ?? null,
        daysLeft: batteryDaysLeft(bin.status?.battery,
            trendPerDay(readings.get(String(bin._id)) ?? [], 'battery')),
    }))
        .filter(bin => bin.daysLeft !== null && bin.daysLeft <= BATTERY_SOON_DAYS)
        .sort((a, b) => a.daysLeft - b.daysLeft);
    return {
        buckets: bucketCounts(bins.map(bin => bin.status?.battery).filter(Number.isFinite), BATTERY_BUCKETS),
        soonDays: BATTERY_SOON_DAYS,
        soon: soon.slice(0, BATTERY_SOON_LIST_LIMIT),
    };
}

async function connectivityOverview(user) {
    const days = RELIABILITY_DAYS[0];
    const start = rangeStart(days);
    const now = new Date();
    const bins = await scopedBins(user, {}, { binName: 1, kind: 1, ownerId: 1, 'status.connection': 1 });
    const [counts, intervals, firstReports] = await Promise.all([
        binLogModel.aggregate([
            { $match: { binId: { $in: bins.map(bin => bin._id) }, ...READINGS_FILTER, createdAt: { $gte: start } } },
            { $group: { _id: '$binId', count: { $sum: 1 } } },
        ]),
        intervalsByOrg(bins),
        firstReportTimes(bins.map(bin => bin._id)),
    ]);
    const received = new Map(counts.map(count => [String(count._id), count.count]));
    const names = new Map(bins.map(bin => [String(bin._id), bin.binName]));

    const gateways = new Map();
    for (const bin of bins) {
        const { via, gatewayId, rssi } = bin.status?.connection ?? {};
        if (via !== 'mesh' || !gatewayId) continue;
        const gateway = gateways.get(String(gatewayId)) ?? { _id: gatewayId, leaves: 0, rssi: [] };
        gateway.leaves++;
        if (Number.isFinite(rssi)) gateway.rssi.push(rssi);
        gateways.set(String(gatewayId), gateway);
    }

    const reliability = bins.map(bin => ({
        _id: bin._id,
        binName: bin.binName,
        ...reportReliability(received.get(String(bin._id)) ?? 0, start, now,
            intervals.get(String(bin.ownerId)), firstReports.get(String(bin._id))),
    })).filter(bin => bin.percent !== null);

    return {
        share: {
            cellular: bins.filter(bin => bin.status?.connection?.via === 'cellular').length,
            mesh: bins.filter(bin => bin.status?.connection?.via === 'mesh').length,
            unknown: bins.filter(bin => !bin.status?.connection?.via).length,
        },
        gateways: [...gateways.values()].map(gateway => ({
            _id: gateway._id,
            binName: names.get(String(gateway._id)) ?? null,
            leaves: gateway.leaves,
            avgRssi: average(gateway.rssi),
        })),
        reliabilityDays: days,
        averageReliability: average(reliability.map(bin => bin.percent)),
        leastReliable: reliability
            .filter(bin => bin.percent < 100)
            .sort((a, b) => a.percent - b.percent)
            .slice(0, LEAST_RELIABLE_LIMIT),
    };
}

async function healthCausesOverview(user, { days, timeZone }) {
    const bins = await scopedBins(user, {}, { _id: 1 });
    const start = rangeStart(days);
    const logs = await binLogModel.find(
        { binId: { $in: bins.map(bin => bin._id) }, ...READINGS_FILTER, createdAt: { $gte: start }, message: { $exists: true, $ne: null } },
        { createdAt: 1, message: 1 },
    ).lean();
    const byDay = new Map(daysBetween(start, timeZone).map(day => [
        day, Object.fromEntries(HEALTH_CAUSE_NAMES.map(cause => [cause, 0])),
    ]));
    for (const log of logs) {
        const counts = byDay.get(dayKey(log.createdAt, timeZone));
        if (!counts) continue;
        for (const cause of healthCauses(log.message)) counts[cause]++;
    }
    return { daily: [...byDay].map(([day, counts]) => ({ day, ...counts })) };
}

const OVERVIEW_SECTIONS = {
    'full-soon': fullSoon,
    'fullness-distribution': fullnessDistribution,
    collections: collectionsOverview,
    waste: wasteOverview,
    battery: batteryOverview,
    connectivity: connectivityOverview,
    'health-causes': healthCausesOverview,
    ...DASHBOARD_SECTIONS,
};

export async function getOverviewSection(req, res) {
    const section = OVERVIEW_SECTIONS[req.params.section];
    if (!section) return res.status(404).json({ message: `Unknown analytics section '${req.params.section}'.` });
    try {
        res.status(200).json(await section(req.user, {
            days: parseRangeDays(req.query.range),
            timeZone: requestTimeZone(req),
        }));
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to load the analytics.' });
    }
}
