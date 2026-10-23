import { binLogModel, binModel } from '../models/models.js'
import { BINS_ONLY_FILTER, scopeToOrganization } from '../../utils/helpers.js'
import { getOrgDeviceSettingsShared } from '../service/sharedService.js'
import { binFullness } from '../../utils/analytics.js'
import {
    ATTENTION_LIST_LIMIT, BATTERY_WARNING_PERCENT, FULLNESS_CRITICAL_PERCENT, OFFLINE_AFTER_MISSED_REPORTS,
    OFFLINE_GRACE_MS, RECENT_LOGS_LIMIT, HOUR_MS, MINUTE_MS, RECENT_LOGS_HOURS,
} from '../../utils/constants.js'

// The dashboard's sections, served like the analytics page's (one request
// each, /api/overviews/<section>). Bins go out without their device key or
// MAC address: the key is what a device authenticates with.

const BIN_PUBLIC_PROJECTION = Object.freeze({ deviceKey: 0, macAddress: 0, 'status.recentMeshMessageIds': 0 });

function isGatewayBin(bin) {
    return bin.kind === 'gateway';
}

// Report intervals per organization, fetched once each.
async function intervalsByOrg(bins) {
    const orgIds = [...new Set(bins.map(bin => String(bin.ownerId)))];
    const settings = await Promise.all(orgIds.map(orgId => getOrgDeviceSettingsShared(orgId)));
    return new Map(orgIds.map((orgId, i) => [orgId, settings[i].reportIntervalMinutes]));
}

// Whether a device has missed OFFLINE_AFTER_MISSED_REPORTS reports in a row.
function isOffline(bin, intervalMinutes, now) {
    const lastReport = bin.status?.updatedAt ?? bin.createdAt;
    const allowedMs = OFFLINE_AFTER_MISSED_REPORTS * intervalMinutes * MINUTE_MS + OFFLINE_GRACE_MS;
    return !lastReport || now - new Date(lastReport).getTime() > allowedMs;
}

// The user's devices, each with why it needs attention (possibly none).
export async function devicesWithReasons(user) {
    const now = Date.now();
    const devices = await binModel.find(scopeToOrganization({}, user), BIN_PUBLIC_PROJECTION).lean();
    const intervals = await intervalsByOrg(devices);
    return devices.map(device => {
        const fullness = isGatewayBin(device) ? null : binFullness(device);
        const reasons = [];
        if (fullness !== null && fullness >= FULLNESS_CRITICAL_PERCENT) reasons.push('full');
        if (device.maintenance?.nextServiceAt && new Date(device.maintenance.nextServiceAt) < new Date(now)) {
            reasons.push('maintenance');
        }
        if (isOffline(device, intervals.get(String(device.ownerId)), now)) reasons.push('offline');
        if (Number.isFinite(device.status?.battery) && device.status.battery <= BATTERY_WARNING_PERCENT) reasons.push('battery');
        if (['warning', 'critical'].includes(device.status?.health)) reasons.push('health');
        return { ...device, fullness, reasons };
    });
}

// The tiles' counts: almost full, overdue maintenance and the average fullness.
async function summary(user) {
    const devices = await devicesWithReasons(user);
    const bins = devices.filter(device => !isGatewayBin(device));
    const fullnesses = bins.map(bin => bin.fullness).filter(value => value !== null);
    return {
        totalBins: bins.length,
        almostFull: bins.filter(bin => bin.reasons.includes('full')).length,
        requiringMaintenance: devices.filter(device => device.reasons.includes('maintenance')).length,
        averageFullness: fullnesses.length > 0
            ? Math.round(fullnesses.reduce((sum, value) => sum + value, 0) / fullnesses.length)
            : null,
    };
}

// Devices that stopped reporting, gateways included: a silent gateway also
// silences every leaf behind it.
async function offline(user) {
    const devices = (await devicesWithReasons(user)).filter(device => device.reasons.includes('offline'));
    const lastReport = device => device.status?.updatedAt ?? device.createdAt ?? null;
    return {
        count: devices.length,
        missedReports: OFFLINE_AFTER_MISSED_REPORTS,
        devices: devices
            .sort((a, b) => new Date(lastReport(a)) - new Date(lastReport(b)))
            .slice(0, ATTENTION_LIST_LIMIT)
            .map(device => ({ _id: device._id, binName: device.binName, kind: device.kind, lastReport: lastReport(device) })),
    };
}

// Devices that need attention, with the reasons; the map shows those that need
// a visit (full, maintenance due or offline), the table all of them.
async function attention(user) {
    const devices = (await devicesWithReasons(user)).filter(device => device.reasons.length > 0);
    // Most reasons first, then the fullest.
    devices.sort((a, b) => b.reasons.length - a.reasons.length || (b.fullness ?? -1) - (a.fullness ?? -1));
    return { total: devices.length, devices: devices.slice(0, ATTENTION_LIST_LIMIT) };
}

// The last day's reports and events, newest first, with each bin's name.
// Gateways' logs stay out, as in the other fleet statistics.
async function recentLogs(user) {
    const bins = await binModel.find(scopeToOrganization({ ...BINS_ONLY_FILTER }, user), { binName: 1 }).lean();
    const names = new Map(bins.map(bin => [String(bin._id), bin.binName]));
    const logs = await binLogModel.find(
        { binId: { $in: bins.map(bin => bin._id) }, createdAt: { $gte: new Date(Date.now() - RECENT_LOGS_HOURS * HOUR_MS) } },
        { binId: 1, type: 1, severity: 1, newLevel: 1, weight: 1, health: 1, message: 1, createdAt: 1 },
    ).sort({ createdAt: -1 }).limit(RECENT_LOGS_LIMIT).lean();
    return { logs: logs.map(log => ({ ...log, binName: names.get(String(log.binId)) ?? null })) };
}

export const DASHBOARD_SECTIONS = {
    summary,
    offline,
    attention,
    'recent-logs': recentLogs,
};
