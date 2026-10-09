import tzLookup from "tz-lookup";

const REPORT_INTERVAL_MINUTES = Number(process.env.DEVICE_REPORT_INTERVAL_MINUTES ?? 1);

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

    const sleepDurationSeconds = REPORT_INTERVAL_MINUTES * 60;
    return {
        timeZone,
        nextWakeEpoch: Math.floor(now / 1000) + sleepDurationSeconds,
        sleepDurationSeconds,
    };
}
