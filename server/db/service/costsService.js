import mongoose from "mongoose";
import { binModel, organizationModel, routeModel } from "../models/models.js";
import { readingsByBin } from "./readingsService.js";
import { BINS_ONLY_FILTER } from "../../utils/helpers.js";
import { COST_PER_COLLECTION_DAYS, ROLES } from "../../utils/constants.js";
import { dayKey, daysBetween, detectCollections, rangeStart } from "../../utils/analytics.js";
import { combineMoney, organizationMoney } from "../../utils/costs.js";

const ROUTE_FIELDS = Object.freeze({
    status: 1, serviceDay: 1, closedByDay: 1, startedAt: 1, finishedAt: 1, truck: 1,
    distanceMeters: 1, durationSeconds: 1, plannedDistanceMeters: 1, plannedDurationSeconds: 1, 'stops.status': 1,
});

// The organizations in the user's scope: an owner's picked one, or all of
// them; anyone else's own. Hydrated, so ones saved before costs existed get
// the defaults.
async function scopedOrganizations({ role, org, selectedOrg }) {
    const query = role === ROLES.OWNER ? (selectedOrg ? { _id: selectedOrg } : {}) : { _id: org };
    const organizations = await organizationModel.find(query, { costs: 1, fleet: 1 });
    return organizations.map(organization => organization.toObject());
}

// One organization's range: its collection routes (by service day, in the
// range; and those of the last COST_PER_COLLECTION_DAYS, to learn what a
// collection costs), and every collection its bins' reports show, with the
// bins that reported (the old schedule emptied those).
async function organizationData(organization, { start, timeZone }) {
    const orgId = new mongoose.Types.ObjectId(organization._id);
    const learnFrom = dayKey(rangeStart(COST_PER_COLLECTION_DAYS), timeZone);
    const startDay = dayKey(start, timeZone);
    const [learningRoutes, bins] = await Promise.all([
        routeModel.find({ orgId, type: 'collection', status: { $ne: 'cancelled' }, serviceDay: { $gte: learnFrom < startDay ? learnFrom : startDay } }, ROUTE_FIELDS).lean(),
        binModel.find({ ...BINS_ONLY_FILTER, ownerId: orgId }, { _id: 1 }).lean(),
    ]);
    const readings = await readingsByBin(bins.map(bin => bin._id), start);
    const collections = [...readings.values()].flatMap(binReadings => detectCollections(binReadings))
        .filter(collection => collection.at >= start)
        .map(collection => ({ ...collection, day: dayKey(collection.at, timeZone) }));
    return {
        routes: learningRoutes.filter(route => route.serviceDay >= startDay),
        learningRoutes: learningRoutes.filter(route => route.serviceDay >= learnFrom),
        collections,
        reportingBins: readings.size,
    };
}

// The money of the range in the user's scope: what collecting spent, what the
// system saved against each organization's old schedule, and per day (see
// utils/costs.js). In ₪.
export async function costsOverview(user, { days, timeZone }) {
    const start = rangeStart(days);
    const dayList = daysBetween(start, timeZone).map(day => ({ day }));
    const organizations = await scopedOrganizations(user);
    const money = await Promise.all(organizations.map(async organization => organizationMoney({
        costs: organization.costs,
        fleet: organization.fleet,
        days: dayList,
        rangeDays: days,
        ...await organizationData(organization, { start, timeZone }),
    })));
    return { days, ...combineMoney(money, dayList) };
}
