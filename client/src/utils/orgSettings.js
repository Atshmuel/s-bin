const MINUTES_PER_DAY = 24 * 60;
// Up to this many reports a day are listed by time; more are described.
const MAX_LISTED_REPORT_TIMES = 4;

export function formatReportInterval(minutes, t) {
    if (minutes < 60) return t("components.orgSettings.everyMinutes", { count: minutes });
    if (minutes === 60) return t("components.orgSettings.everyHour");
    if (minutes === MINUTES_PER_DAY) return t("components.orgSettings.everyDay");
    return t("components.orgSettings.everyHours", { count: minutes / 60 });
}

export function formatHour(hour) {
    return `${String(hour).padStart(2, "0")}:00`;
}

function formatMinuteOfDay(minute) {
    return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

// The day's report times (the start hour plus multiples of the interval), as
// "08:00 and 20:00", or as "Every 3 hours from 10:00" when there are many.
export function formatReportSchedule(intervalMinutes, startHour, t, language) {
    if (MINUTES_PER_DAY / intervalMinutes > MAX_LISTED_REPORT_TIMES) {
        return t("components.orgSettings.everyFrom", {
            interval: formatReportInterval(intervalMinutes, t),
            time: formatHour(startHour),
        });
    }
    const times = [];
    for (let minute = (startHour * 60) % intervalMinutes; minute < MINUTES_PER_DAY; minute += intervalMinutes) {
        times.push(formatMinuteOfDay(minute));
    }
    return new Intl.ListFormat(language, { type: "conjunction" }).format(times);
}
