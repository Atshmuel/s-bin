import cron from "node-cron";
import { refreshAllStats } from "../service/statsService.js";
import { refreshFillRates } from "../service/fillRateService.js";
import { CRON_SCHEDULES } from "../../utils/constants.js";

// Every hour, and once at start: each organization's recent days in numbers
// (and any missing), and every bin's stale fill rate, so the analytics and the
// nightly plan rarely wait for them.
if (!global.orgStatsCronStarted) {
    global.orgStatsCronStarted = true;
    console.log("orgStatsCronStarted");

    const refresh = async () => {
        try {
            await refreshAllStats();
        } catch (err) {
            console.error("[Cron] Error refreshing the organizations' stats:", err);
        }
        try {
            await refreshFillRates();
        } catch (err) {
            console.error("[Cron] Error refreshing the bins' fill rates:", err);
        }
    };
    cron.schedule(CRON_SCHEDULES.orgStats, refresh);
    refresh();
}
