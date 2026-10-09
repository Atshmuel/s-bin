import tzLookup from "tz-lookup";

const REPORT_HOURS = [8, 20];
const formatterCache = new Map();

function getFormatter(timeZone) {
    if (!formatterCache.has(timeZone)) {
        formatterCache.set(timeZone, new Intl.DateTimeFormat("en-US", {
            timeZone,
            calendar: "gregory",
            numberingSystem: "latn",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hourCycle: "h23",
        }));
    }
    return formatterCache.get(timeZone);
}

function getTimeZoneParts(epochMilliseconds, timeZone) {
    const parts = getFormatter(timeZone).formatToParts(new Date(epochMilliseconds));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
    return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        second: values.second,
    };
}

function localTimeToEpoch({ year, month, day, hour }, timeZone) {
    const localAsUtc = Date.UTC(year, month - 1, day, hour);
    let candidate = localAsUtc;

    for (let attempt = 0; attempt < 3; attempt++) {
        const parts = getTimeZoneParts(candidate, timeZone);
        const representedAsUtc = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second,
        );
        candidate += localAsUtc - representedAsUtc;
    }

    return Math.floor(candidate / 1000);
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
    const localNow = getTimeZoneParts(now, timeZone);
    const localDate = new Date(Date.UTC(localNow.year, localNow.month - 1, localNow.day));

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const candidateDate = new Date(localDate);
        candidateDate.setUTCDate(candidateDate.getUTCDate() + dayOffset);

        for (const hour of REPORT_HOURS) {
            const nextWakeEpoch = localTimeToEpoch({
                year: candidateDate.getUTCFullYear(),
                month: candidateDate.getUTCMonth() + 1,
                day: candidateDate.getUTCDate(),
                hour,
            }, timeZone);

            if (nextWakeEpoch > Math.floor(now / 1000) + 30) {
                return { timeZone, nextWakeEpoch };
            }
        }
    }

    throw new Error(`Could not calculate the next report time for ${timeZone}.`);
}
