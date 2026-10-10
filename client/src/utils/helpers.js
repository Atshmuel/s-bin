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
