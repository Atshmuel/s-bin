// A date, with its time unless options pick fields, in the app's language and
// on a 24-hour clock.
export function formatDate(value, isRight, options) {
    return new Date(value).toLocaleString(isRight ? "en-US" : "he-IL", { hourCycle: "h23", ...options })
}

export function formatSleepDuration(seconds, t) {
    if (seconds >= 3600) {
        const hours = Number((seconds / 3600).toFixed(1));
        return `${hours} ${t("units.hours")}`;
    }

    if (seconds < 60) {
        return `${seconds} ${t("units.seconds")}`;
    }

    return `${Number((seconds / 60).toFixed(1))} ${t("units.minutes")}`;
}
