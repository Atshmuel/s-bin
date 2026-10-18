import tzLookup from "tz-lookup";
import { DEFAULT_REPORT_INTERVAL_MINUTES, DEFAULT_REPORT_START_HOUR } from "../db/schema/organizationSchema.js";

const MINUTES_PER_DAY = 24 * 60;
// Device sleep clocks run fast (about +1% measured, minutes per 12 hours), so a
// report can arrive before its slot; one this close before a slot belongs to that
// slot, so the next wake is the slot after it instead of a second report minutes
// later.
const EARLY_WAKE_TOLERANCE_SECONDS = 600;

const wallClockFormats = new Map();

// The wall-clock date and time of an instant in a time zone.
function wallClock(epochSeconds, timeZone) {
    let format = wallClockFormats.get(timeZone);
    if (!format) {
        format = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        });
        wallClockFormats.set(timeZone, format);
    }
    return Object.fromEntries(format.formatToParts(new Date(epochSeconds * 1000))
        .filter(({ type }) => type !== "literal")
        .map(({ type, value }) => [type, Number(value)]));
}

// How far the time zone's wall clock is ahead of UTC at an instant.
function utcOffsetSeconds(epochSeconds, timeZone) {
    const { year, month, day, hour, minute, second } = wallClock(epochSeconds, timeZone);
    return Date.UTC(year, month - 1, day, hour, minute, second) / 1000 - epochSeconds;
}

// The instant a local wall-clock time occurs. The offset is checked again at
// the result, since a clock change between the two can move it by an hour.
function zonedEpoch(year, month, day, minuteOfDay, timeZone) {
    const asUtc = Date.UTC(year, month - 1, day, 0, minuteOfDay) / 1000;
    const guess = asUtc - utcOffsetSeconds(asUtc, timeZone);
    return asUtc - utcOffsetSeconds(guess, timeZone);
}

// The first slot after an instant. Each local day's slots are the start hour
// plus multiples of the interval, so the chosen hour stays the same local hour
// all year. The day before through two days ahead covers any interval up to a
// day, across a clock change.
function nextSlotEpoch(afterSeconds, intervalMinutes, startHour, timeZone) {
    const { year, month, day } = wallClock(afterSeconds, timeZone);
    const firstMinute = (startHour * 60) % intervalMinutes;
    let next = Infinity;
    for (let dayOffset = -1; dayOffset <= 2; dayOffset++) {
        const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
        for (let minute = firstMinute; minute < MINUTES_PER_DAY; minute += intervalMinutes) {
            const slot = zonedEpoch(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), minute, timeZone);
            if (slot > afterSeconds && slot < next) {
                next = slot;
            }
        }
    }
    return next;
}

// intervalMinutes and startHour are the organization's report interval and the
// local hour of its first report each day.
export function getNextReportSchedule(
    location,
    intervalMinutes = DEFAULT_REPORT_INTERVAL_MINUTES,
    startHour = DEFAULT_REPORT_START_HOUR,
    now = Date.now(),
) {
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
        MINUTES_PER_DAY % intervalMinutes !== 0) {
        throw new RangeError("The report interval must be a whole number of minutes that divides a day.");
    }
    if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
        throw new RangeError("The report start hour must be an integer from 0 to 23.");
    }

    const nowSeconds = Math.floor(now / 1000);
    const intervalToleranceSeconds = Math.min(
        EARLY_WAKE_TOLERANCE_SECONDS,
        Math.floor(intervalMinutes * 60 / 4),
    );
    const nextWakeEpoch = nextSlotEpoch(nowSeconds + intervalToleranceSeconds, intervalMinutes, startHour, timeZone);
    // Gateways read the server's clock from this as nextWakeEpoch minus
    // sleepDurationSeconds, so both stay measured from the same now.
    const sleepDurationSeconds = nextWakeEpoch - nowSeconds;
    // The slot after next: mesh gateways advertise it to leaves at the next wake,
    // before they have reached the server for that cycle.
    const followingWakeEpoch = nextSlotEpoch(nextWakeEpoch, intervalMinutes, startHour, timeZone);
    return {
        timeZone,
        nextWakeEpoch,
        followingWakeEpoch,
        sleepDurationSeconds,
    };
}
