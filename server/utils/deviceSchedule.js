import tzLookup from "tz-lookup";
import { DEFAULT_REPORT_INTERVAL_MINUTES } from "../db/schema/organizationSchema.js";

// These UTC slots correspond to 08:00/20:00 in summer and 07:00/19:00 in winter in Israel.
const FIXED_REPORT_TIMES_UTC = [5, 17];
// Device sleep clocks run fast (about +0.5%, so ~4 minutes per 12 hours). A report
// arriving this close before a slot belongs to that slot, so the next wake is the
// slot after it instead of a second report minutes later.
const EARLY_WAKE_TOLERANCE_SECONDS = 600;

function getNextFixedReportEpoch(now) {
    const nowSeconds = Math.floor(now / 1000) + EARLY_WAKE_TOLERANCE_SECONDS;
    const date = new Date(now);
    const utcMidnight = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
    ) / 1000;
    const reportSlots = [
        ...FIXED_REPORT_TIMES_UTC.map(hour => utcMidnight + hour * 60 * 60),
        ...FIXED_REPORT_TIMES_UTC.map(hour => utcMidnight + 24 * 60 * 60 + hour * 60 * 60),
    ];
    const nextSlotIndex = reportSlots.findIndex(slot => slot > nowSeconds);
    return reportSlots[nextSlotIndex];
}

// intervalMinutes is the organization's report interval; 720 uses the fixed
// daily slots, anything shorter aligns to multiples of the interval.
export function getNextReportSchedule(location, intervalMinutes = DEFAULT_REPORT_INTERVAL_MINUTES, now = Date.now()) {
    if (!Array.isArray(location) || location.length !== 2) {
        throw new TypeError("Device location must contain latitude and longitude.");
    }

    const [latitude, longitude] = location;
    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new RangeError("Device location contains invalid latitude or longitude.");
    }

    const timeZone = tzLookup(latitude, longitude);
    if (!Number.isInteger(intervalMinutes) ||
        intervalMinutes < 1 ||
        intervalMinutes > 720) {
        throw new RangeError("The report interval must be an integer from 1 to 720 minutes.");
    }

    const nowSeconds = Math.floor(now / 1000);
    const intervalSeconds = intervalMinutes * 60;
    const intervalToleranceSeconds = Math.min(
        EARLY_WAKE_TOLERANCE_SECONDS,
        Math.floor(intervalSeconds / 4),
    );
    const nextWakeEpoch = intervalMinutes === 720
        ? getNextFixedReportEpoch(now)
        : (Math.floor((nowSeconds + intervalToleranceSeconds) / intervalSeconds) + 1) * intervalSeconds;
    const sleepDurationSeconds = nextWakeEpoch - nowSeconds;
    // The slot after next: mesh gateways advertise it to leaves at the next wake,
    // before they have reached the server for that cycle.
    const followingWakeEpoch = intervalMinutes === 720
        ? getNextFixedReportEpoch(nextWakeEpoch * 1000)
        : nextWakeEpoch + intervalSeconds;
    return {
        timeZone,
        nextWakeEpoch,
        followingWakeEpoch,
        sleepDurationSeconds,
    };
}
