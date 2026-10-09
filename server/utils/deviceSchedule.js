import tzLookup from "tz-lookup";

const REPORT_INTERVAL_MINUTES = Number(process.env.DEVICE_REPORT_INTERVAL_MINUTES ?? 1);
// Keep production reports on shared UTC slots; skip a slot if it is less than three hours away.
const FIXED_REPORT_TIMES_UTC = [5, 17];
const REPORT_SLOT_SKIP_WINDOW_SECONDS = 3 * 60 * 60;

function getNextFixedReportEpoch(now) {
    const nowSeconds = Math.floor(now / 1000);
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
    const nextSlot = reportSlots[nextSlotIndex];
    const selectedSlot = nextSlot - nowSeconds <= REPORT_SLOT_SKIP_WINDOW_SECONDS
        ? reportSlots[nextSlotIndex + 1]
        : nextSlot;

    return selectedSlot;
}

export function getNextReportSchedule(location, now = Date.now()) {
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
    if (!Number.isInteger(REPORT_INTERVAL_MINUTES) ||
        REPORT_INTERVAL_MINUTES < 1 ||
        REPORT_INTERVAL_MINUTES > 720) {
        throw new RangeError("DEVICE_REPORT_INTERVAL_MINUTES must be an integer from 1 to 720.");
    }

    const nowSeconds = Math.floor(now / 1000);
    const nextWakeEpoch = REPORT_INTERVAL_MINUTES === 720
        ? getNextFixedReportEpoch(now)
        : nowSeconds + REPORT_INTERVAL_MINUTES * 60;
    const sleepDurationSeconds = nextWakeEpoch - nowSeconds;
    return {
        timeZone,
        nextWakeEpoch,
        sleepDurationSeconds,
    };
}
