// Which devices are offline and why, for the dashboard and the offline alert.
// A device is offline once it has missed OFFLINE_AFTER_MISSED_REPORTS reports
// in a row. A leaf reports through a gateway: when that gateway went silent at
// about the same time, the gateway is the cause, not the leaf.

import { MINUTE_MS, OFFLINE_AFTER_MISSED_REPORTS, OFFLINE_GRACE_MS } from './constants.js';

export function lastReportAt(device) {
    return device.status?.updatedAt ?? device.createdAt ?? null;
}

export function isOffline(device, intervalMinutes, now) {
    const lastReport = lastReportAt(device);
    const allowedMs = OFFLINE_AFTER_MISSED_REPORTS * intervalMinutes * MINUTE_MS + OFFLINE_GRACE_MS;
    return !lastReport || now - new Date(lastReport).getTime() > allowedMs;
}

// The device a leaf's last report came through; null for a device with its
// own connection.
export function upstreamId(device) {
    return device.status?.connection?.via === 'mesh' ? device.status.connection.gatewayId ?? null : null;
}

// Whether the upstream went silent with the device: a working one would have
// reported again a slot after the device's last report, so it has not
// reported since half an interval after it.
function upstreamSilent(device, upstream, intervalMinutes) {
    const upstreamLast = lastReportAt(upstream);
    if (!upstreamLast) return true;
    return new Date(upstreamLast).getTime() <
        new Date(lastReportAt(device)).getTime() + intervalMinutes * MINUTE_MS / 2;
}

// Each offline device's cause by its id: { cause: 'gateway', gatewayId } when
// its upstream is silent too, otherwise { cause: 'self' }. Intervals maps an
// organization's id to its report interval in minutes.
export function offlineCauses(devices, intervals, now) {
    const byId = new Map(devices.map(device => [String(device._id), device]));
    const causes = new Map();
    for (const device of devices) {
        const intervalMinutes = intervals.get(String(device.ownerId));
        if (!isOffline(device, intervalMinutes, now)) continue;
        const upstream = byId.get(String(upstreamId(device)));
        causes.set(String(device._id), upstream && upstreamSilent(device, upstream, intervalMinutes)
            ? { cause: 'gateway', gatewayId: upstream._id }
            : { cause: 'self' });
    }
    return causes;
}
