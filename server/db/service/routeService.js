import mongoose from "mongoose";
import { binModel, routeModel, routeReservationModel } from "../models/models.js";
import { appendFilter, BINS_ONLY_FILTER, healthRank } from "../../utils/helpers.js";
import { FULLNESS_EXPRESSION } from "../../utils/analytics.js";
import { timeZoneAt } from "../../utils/geo.js";
import {
    DEFAULT_ROUTE_ENGINE, DEFAULT_TIME_ZONE, HOUR_MS, OPEN_ROUTE_STATUSES, ROLES, ROUTE_ENGINES, ROUTE_PLAN_ATTEMPTS,
    ROUTE_RESERVATION_GRACE_HOURS, ROUTE_STOP_SECONDS, WEIGHT_REFERENCE_KG,
} from "../../utils/constants.js";

const DUPLICATE_KEY = 11000;
// What a maintenance route may filter devices by.
export const HEALTH_FILTERS = Object.freeze(["good", "warning", "critical", "all"]);

// A planning failure the caller can show as is: `status` is the HTTP status.
export class RouteError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

// Read per call: process.env holds .env's values only once the server has started.
export function routeEngine() {
    return ROUTE_ENGINES[process.env.ROUTE_ENGINE] ?? ROUTE_ENGINES[DEFAULT_ROUTE_ENGINE];
}

// A bin's expected load in kg: its weight from a working scale, or else its
// fullness of WEIGHT_REFERENCE_KG (what a full bin weighs).
export function binLoadKg(bin) {
    const kg = bin.status?.scale === "ok" && Number.isFinite(bin.status?.weight)
        ? bin.status.weight
        : (bin.fullness ?? 0) / 100 * WEIGHT_REFERENCE_KG;
    return Math.max(Math.ceil(kg), 1);
}

// The organization's time zone: its depot's, or else its devices'.
export async function organizationTimeZone(org) {
    const depot = org.depot?.location;
    if (depot) return timeZoneAt(depot);
    const bin = await binModel.findOne({ ownerId: org._id, timezone: { $type: "string" } }, { timezone: 1 }).lean();
    return bin?.timezone ?? DEFAULT_TIME_ZONE;
}

// The date (YYYY-MM-DD) an instant falls on in a time zone.
export function serviceDayOf(date, timeZone) {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// When a reservation lapses if the day's closing never released it: the
// grace after the service day (counted from the next UTC midnight, a few
// hours either side of the local one, which is close enough for a safety net).
export function reservationExpiry(serviceDay) {
    const [year, month, day] = serviceDay.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + 1) + ROUTE_RESERVATION_GRACE_HOURS * HOUR_MS);
}

// Which routes a user may see, as a query filter; null when none. Owners see
// every organization's (an owner's ?org= narrows it), admins their own
// organization's, drivers the routes they drive.
export function routeAccessFilter({ id, role, org, selectedOrg }) {
    if (role === ROLES.OWNER) return selectedOrg ? { orgId: new mongoose.Types.ObjectId(selectedOrg) } : {};
    if (role === ROLES.ADMIN) return org ? { orgId: new mongoose.Types.ObjectId(org) } : null;
    if (role === ROLES.DRIVER) return { driverId: new mongoose.Types.ObjectId(id) };
    return null;
}

// The bins a route would visit: in the radius around `coordinates`, not held
// by another open route, a collection through the bins in the fullness range,
// a maintenance visit through the devices (gateways too) in the health filter;
// the most urgent first, at most what the optimizer takes. `total` counts all
// that matched.
export async function selectRouteBins({ scope, coordinates, radius, type, fullnessRange, healthFilter, excludeIds = [] }) {
    let query = appendFilter(scope, healthFilter !== "all", "status.health", healthFilter);
    if (excludeIds.length) query = { ...query, _id: { $nin: excludeIds } };
    const fullnessStages = [{ $addFields: { fullness: FULLNESS_EXPRESSION } }];
    if (type === "collection") {
        // Gateways need maintenance visits but are never collected.
        query = { ...query, ...BINS_ONLY_FILTER };
        fullnessStages.push({ $match: { fullness: { $gte: fullnessRange[0], $lte: fullnessRange[1] } } });
    }
    const [result] = await binModel.aggregate([
        { $geoNear: { near: { type: "Point", coordinates }, distanceField: "distance", spherical: true, maxDistance: radius, query } },
        ...fullnessStages,
        // The fullest for a collection, the worst health for maintenance; the nearest breaks ties.
        { $addFields: { urgency: type === "collection" ? "$fullness" : healthRank("$status.health") } },
        {
            $facet: {
                total: [{ $count: "count" }],
                bins: [
                    { $sort: { urgency: -1, distance: 1 } },
                    { $limit: routeEngine().maxBins },
                    { $project: { _id: 1, binName: 1, location: 1, status: 1, fullness: 1 } },
                ],
            },
        },
    ]);
    return { bins: result?.bins ?? [], total: result?.total[0]?.count ?? 0 };
}

// The optimizer's order through `bins` from `origin`, back to `depot` when
// there is one. With a truck it takes what fits, the fullest first. Returns
// null when no bin fits; throws a RouteError when the optimizer fails.
export async function optimizeRoute({ bins, type, origin, depot, truck }) {
    const engine = routeEngine();
    // The optimizer reads [lng, lat], as every location is stored.
    const jobs = bins.map((bin, i) => ({
        id: i + 1,
        location: bin.location.coordinates,
        service: ROUTE_STOP_SECONDS[type] ?? ROUTE_STOP_SECONDS.collection,
        // Priority 0-100 decides which bins a full truck leaves.
        ...(truck ? { pickup: [binLoadKg(bin)], priority: Math.round(Math.min(Math.max(bin.fullness ?? 0, 0), 100)) } : {}),
    }));
    const response = await fetch(`${process.env.ROUTE_OPTIMIZATION_API_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // OpenRouteService's key; our VROOM needs none.
            ...(process.env.ORS_KEY ? { Authorization: process.env.ORS_KEY } : {}),
        },
        body: JSON.stringify({
            jobs,
            vehicles: [{
                id: 1,
                profile: engine.profile[type] ?? engine.profile.collection,
                start: origin,
                ...(depot ? { end: depot } : {}),
                ...(truck ? { capacity: [truck.capacityKg] } : {}),
            }],
            options: { g: true },
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        console.error("Route optimizer error:", data);
        throw new RouteError(400, "Failed to optimize route", data);
    }
    const route = data.routes?.[0];
    if (!route) return null;
    // The stops in driving order, numbered from 1.
    const stops = route.steps.filter(step => step.type === "job").map((step, i) => {
        const bin = bins[step.id - 1];
        return { bin, order: i + 1, loadKg: truck ? binLoadKg(bin) : null };
    });
    return {
        geometry: route.geometry,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        stops,
        loadKg: truck ? stops.reduce((sum, stop) => sum + stop.loadKg, 0) : null,
    };
}

// Bins held by the organization's open routes (every organization's without one).
export async function reservedBinIds(orgId) {
    return routeReservationModel.distinct("binId", orgId ? { orgId } : {});
}

// The lowest truck of a type without an open route on the day; null when all
// of them have one.
export async function freeTruckUnit(orgId, serviceDay, truckType) {
    const taken = await routeModel.distinct("truck.unit", {
        orgId, serviceDay, "truck.truckTypeId": truckType._id, status: { $in: OPEN_ROUTE_STATUSES },
    });
    for (let unit = 1; unit <= truckType.count; unit++) {
        if (!taken.includes(unit)) return unit;
    }
    return null;
}

// Plans a route by hand and stores it with its bins reserved. Bins another
// route holds are left out; one reserved by a plan in the same moment makes
// the plan run again without it. For a collection with a truck type, the
// route takes its lowest truck free that day. Returns the route, or
// { reason } when nothing matched ("noBins") or fitted ("noFit").
export async function planRoute({ org, user, type, coordinates, radius, fullnessRange, healthFilter, truckType }) {
    const timeZone = await organizationTimeZone(org);
    const serviceDay = serviceDayOf(new Date(), timeZone);
    const depot = org.depot?.location ?? null;
    const origin = depot ?? coordinates;
    const scope = { ownerId: org._id };
    const excludeIds = await reservedBinIds(org._id);

    for (let attempt = 1; attempt <= ROUTE_PLAN_ATTEMPTS; attempt++) {
        const unit = truckType ? await freeTruckUnit(org._id, serviceDay, truckType) : null;
        if (truckType && !unit) {
            throw new RouteError(409, `Every ${truckType.name} (${truckType.count}) already has a route today.`);
        }
        const { bins, total } = await selectRouteBins({ scope, coordinates, radius, type, fullnessRange, healthFilter, excludeIds });
        if (bins.length === 0) return { reason: "noBins", total };
        const plan = await optimizeRoute({ bins, type, origin, depot, truck: truckType });
        if (!plan) return { reason: "noFit", total };

        const routeId = new mongoose.Types.ObjectId();
        const expiresAt = reservationExpiry(serviceDay);
        const reservations = plan.stops.map(({ bin }) => ({ orgId: org._id, binId: bin._id, routeId, expiresAt }));
        try {
            await routeReservationModel.insertMany(reservations, { ordered: false });
        } catch (error) {
            await routeReservationModel.deleteMany({ routeId });
            // Mongoose copies each write error to a plain object, which keeps
            // `err` but loses the driver's `code` getter.
            const taken = (error?.writeErrors ?? []).filter(writeError => (writeError.err?.code ?? writeError.code) === DUPLICATE_KEY);
            if (taken.length === 0) throw error;
            // Taken by another plan meanwhile: plan again without them.
            excludeIds.push(...taken.map(writeError => reservations[writeError.index].binId));
            continue;
        }
        try {
            return await routeModel.create({
                _id: routeId,
                orgId: org._id,
                type,
                source: "manual",
                serviceDay,
                timeZone,
                truck: truckType
                    ? { truckTypeId: truckType._id, unit, name: truckType.name, preset: truckType.preset, capacityKg: truckType.capacityKg }
                    : null,
                start: origin,
                end: depot ?? undefined,
                fromDepot: Boolean(depot),
                geometry: plan.geometry,
                distanceMeters: plan.distanceMeters,
                durationSeconds: plan.durationSeconds,
                plannedDistanceMeters: plan.distanceMeters,
                plannedDurationSeconds: plan.durationSeconds,
                loadKg: plan.loadKg,
                leftOut: total - plan.stops.length,
                stops: plan.stops.map(({ bin, order, loadKg }) => ({
                    binId: bin._id,
                    binName: bin.binName,
                    location: bin.location.coordinates,
                    order,
                    fullnessAtPlan: bin.fullness,
                    loadKg,
                })),
                createdBy: user.id,
            });
        } catch (error) {
            await routeReservationModel.deleteMany({ routeId });
            // The truck got a route meanwhile: take the next one.
            if (error?.code === DUPLICATE_KEY) continue;
            throw error;
        }
    }
    throw new RouteError(409, "Other routes kept taking these bins; try again.");
}

// Frees a route's bins for other routes.
export async function releaseRoute(routeId) {
    await routeReservationModel.deleteMany({ routeId });
}

// Who may drive a route (mark its stops, re-order, finish): its driver, or an
// admin of its organization (from the office). Owners manage routes but do not
// drive them. Claims record who.
export function canDriveRoute(route, { id, role, org }) {
    if (role === ROLES.DRIVER) return String(route.driverId) === id;
    return role === ROLES.ADMIN && String(route.orgId) === org;
}

// Re-orders the stops not yet done from the driver's position ([lng, lat])
// back to the route's end: the same bins, so the same reservations and load.
// Stops done or skipped keep their place first; the line, distance and time
// become those from the position on.
export async function reorderFromPosition(route, position) {
    const remaining = route.stops.filter(stop => stop.status === "planned");
    if (remaining.length === 0) return;
    // Each job carries its stop; the optimizer hands the same objects back in order.
    const plan = await optimizeRoute({
        bins: remaining.map(stop => ({ stop, location: { coordinates: stop.location }, fullness: stop.fullnessAtPlan })),
        type: route.type,
        origin: position,
        depot: route.end?.length ? route.end : null,
        truck: null,
    });
    if (!plan) return;
    const settled = route.stops.filter(stop => stop.status !== "planned").sort((a, b) => a.order - b.order);
    const ordered = plan.stops.map(({ bin }) => bin.stop);
    // A stop the optimizer left out (not reachable) keeps its place at the end.
    const missing = remaining.filter(stop => !ordered.includes(stop));
    [...settled, ...ordered, ...missing].forEach((stop, i) => { stop.order = i + 1; });
    route.stops.sort((a, b) => a.order - b.order);
    route.geometry = plan.geometry;
    route.distanceMeters = plan.distanceMeters;
    route.durationSeconds = plan.durationSeconds;
}

// Frees one bin of a route (a skipped stop).
export async function releaseStop(routeId, binId) {
    await routeReservationModel.deleteOne({ routeId, binId });
}

// Holds a bin for a route again (a skip undone). Throws a RouteError when
// another route took the bin meanwhile.
export async function reserveStop(route, binId) {
    try {
        await routeReservationModel.create({ orgId: route.orgId, binId, routeId: route._id, expiresAt: reservationExpiry(route.serviceDay) });
    } catch (error) {
        if (error?.code === DUPLICATE_KEY) throw new RouteError(409, "Another route took this bin meanwhile; it cannot come back to this one.");
        throw error;
    }
}

// Frees the bins of a finished route's stops that were not done; done ones stay
// held until the day closes, so another route does not plan a bin just
// emptied while its last report still says full.
export async function releaseUndone(route) {
    const undone = route.stops.filter(stop => stop.status !== "done").map(stop => stop.binId);
    await routeReservationModel.deleteMany({ routeId: route._id, binId: { $in: undone } });
}

