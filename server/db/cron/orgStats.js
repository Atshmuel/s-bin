import cron from "node-cron";
import { refreshAllStats } from "../service/statsService.js";
import { CRON_SCHEDULES } from "../../utils/constants.js";

// Every hour, and once at start: each organization's recent days in numbers
// (and any missing), so the analytics rarely wait for them.
if (!global.orgStatsCronStarted) {
    global.orgStatsCronStarted = true;
    console.log("orgStatsCronStarted");

    const refresh = async () => {
        try {
            await refreshAllStats();
        } catch (err) {
            console.error("[Cron] Error refreshing the organizations' stats:", err);
        }
    };
    cron.schedule(CRON_SCHEDULES.orgStats, refresh);
    refresh();
}
