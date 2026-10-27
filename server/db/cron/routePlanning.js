import cron from "node-cron";
import { organizationModel } from "../models/models.js";
import { closeRouteDays, organizationTimeZone, planOrganizationDay } from "../service/routeService.js";
import { CRON_SCHEDULES } from "../../utils/constants.js";

// The local hour now in a time zone.
function localHour(timeZone, now) {
    return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
}

// Every hour: the days whose last reports are in close (their routes finish,
// their bins are freed), then each organization whose planning hour it is (in
// its own time zone) gets its day planned; one that fails does not stop the others.
if (!global.routePlanningCronStarted) {
    global.routePlanningCronStarted = true;
    console.log("routePlanningCronStarted");

    cron.schedule(CRON_SCHEDULES.routePlanning, async () => {
        const now = new Date();
        try {
            const closed = await closeRouteDays(now.getTime());
            if (closed.closed || closed.unverifiedRoutes) console.log("[Route days]", JSON.stringify(closed));
        } catch (err) {
            console.error("[Cron] Error closing route days:", err);
        }
        const organizations = await organizationModel.find({ routePlanningHour: { $ne: null } }).lean();
        for (const org of organizations) {
            try {
                if (localHour(await organizationTimeZone(org), now) !== org.routePlanningHour) continue;
                const outcome = await planOrganizationDay(org, { now: now.getTime() });
                console.log(`[Route plan] ${org.name}:`, JSON.stringify(outcome));
            } catch (err) {
                console.error(`[Cron] Error planning the routes of ${org.name}:`, err);
            }
        }
    });
}
