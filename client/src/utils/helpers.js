export function formatSleepDuration(seconds, t) {
    if (seconds >= 3600) {
        const hours = Number((seconds / 3600).toFixed(1));
        return `${hours} ${t("units.hours")}`;
    }

    return `${Number((seconds / 60).toFixed(1))} ${t("units.minutes")}`;
}
