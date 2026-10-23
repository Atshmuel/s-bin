import cron from "node-cron";
import { sendDailyReports } from "../service/dailyReportService.js";
import { CRON_SCHEDULES } from "../../utils/constants.js";

if (!global.dailyReportCronStarted) {
    global.dailyReportCronStarted = true;
    console.log("dailyReportCronStarted");

    cron.schedule(CRON_SCHEDULES.dailyReportEmail, async () => {
        try {
            await sendDailyReports();
        } catch (err) {
            console.error("[Cron] Error sending the daily report:", err);
        }
    });
}
