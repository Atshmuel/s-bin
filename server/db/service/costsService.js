import mongoose from "mongoose";
import { routeModel } from "../models/models.js";
import { lastDays, organizationDays, scopedOrganizations } from "./statsService.js";
import { COST_PER_COLLECTION_DAYS, DAY_MS } from "../../utils/constants.js";
import { dayStartEpoch } from "../../utils/deviceSchedule.js";
import { combineMoney, organizationMoney } from "../../utils/costs.js";

const ROUTE_FIELDS = Object.freeze({
    status: 1, serviceDay: 1, closedByDay: 1, startedAt: 1, finishedAt: 1, truck: 1,
    distanceMeters: 1, durationSeconds: 1, plannedDistanceMeters: 1, plannedDurationSeconds: 1, 'stops.status': 1,
});

// An organization's collection routes since a service day: the range's, and
// those of the last COST_PER_COLLECTION_DAYS, to learn what a collection costs.
async function collectionRoutes(organization, { startDay, timeZone, now }) {
    const learnFrom = lastDays(COST_PER_COLLECTION_DAYS, timeZone, now)[0];
    const routes = await routeModel.find({
        orgId: new mongoose.Types.ObjectId(organization._id), type: 'collection', status: { $ne: 'cancelled' },
        serviceDay: { $gte: learnFrom < startDay ? learnFrom : startDay },
    }, ROUTE_FIELDS).lean();
    return {
        routes: routes.filter(route => route.serviceDay >= startDay),
        learningRoutes: routes.filter(route => route.serviceDay >= learnFrom),
    };
}

// The money of the range's days (the last `days`, ending today) in the user's
// scope: what collecting spent, what the system saved against each
// organization's old schedule, and per day (see utils/costs.js). In ₪.
export async function costsOverview(user, { days, timeZone }) {
    const now = Date.now();
    const dayList = lastDays(days, timeZone, now);
    // Today counts for the part of it gone by.
    const todayShare = Math.min((now - dayStartEpoch(dayList.at(-1), timeZone) * 1000) / DAY_MS, 1);
    const rangeDays = dayList.map((day, index) => ({ day, share: index === dayList.length - 1 ? todayShare : 1 }));
    const organizations = await scopedOrganizations(user, { costs: 1, fleet: 1 });
    const money = await Promise.all(organizations.map(async organization => {
        const [stats, routes] = await Promise.all([
            organizationDays(organization, dayList, { now }),
            collectionRoutes(organization, { startDay: dayList[0], timeZone, now }),
        ]);
        return organizationMoney({ costs: organization.costs, fleet: organization.fleet, days: rangeDays, stats, ...routes });
    }));
    return { days, ...combineMoney(money, rangeDays) };
}
