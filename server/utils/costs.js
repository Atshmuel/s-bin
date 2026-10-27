import { CO2_KG_PER_DIESEL_LITER, DAYS_PER_MONTH, DEFAULT_TRUCK_LITERS_PER_100KM, HOUR_MS, WEIGHT_REFERENCE_KG } from "./constants.js";

// The money an organization's collecting spends and the system saves, from
// what it measured (routes and detected collections) and its own costs.
// Pure: the caller loads the data (db/service/costsService.js).

const EMPTY_USAGE = Object.freeze({ km: 0, hours: 0, liters: 0, collections: 0 });

function addUsage(a, b) {
    return { km: a.km + b.km, hours: a.hours + b.hours, liters: a.liters + b.liters, collections: a.collections + b.collections };
}

// A truck type's diesel use (L per 100 km), by the type a route was planned with.
export function litersPer100KmOf(fleet) {
    const byType = new Map((fleet ?? []).map(type => [String(type._id), type.litersPer100Km ?? DEFAULT_TRUCK_LITERS_PER_100KM]));
    return truckTypeId => byType.get(String(truckTypeId)) ?? DEFAULT_TRUCK_LITERS_PER_100KM;
}

// What a driven route used: its kilometres (the planned ones: "Re-order from
// here" replaces the distance with the rest of the way), hours (real when its
// driver finished it, else planned), diesel, and the bins it collected. A
// route the day's end closed counts for the share of its bins collected; one
// with none collected was not driven.
export function drivenUsage(route, litersFor) {
    const collections = route.stops.filter(stop => stop.status === "done").length;
    if (!collections) return null;
    const isFinished = route.status === "finished" && !route.closedByDay;
    const share = isFinished ? 1 : collections / route.stops.length;
    const km = (route.plannedDistanceMeters ?? route.distanceMeters ?? 0) / 1000 * share;
    const hours = isFinished && route.startedAt && route.finishedAt
        ? (route.finishedAt - route.startedAt) / HOUR_MS
        : (route.plannedDurationSeconds ?? route.durationSeconds ?? 0) / 3600 * share;
    return { km, hours, liters: km * litersFor(route.truck?.truckTypeId) / 100, collections };
}

// What a route would use as planned, for every bin on it.
export function plannedUsage(route, litersFor) {
    if (!route.stops.length) return null;
    const km = (route.plannedDistanceMeters ?? route.distanceMeters ?? 0) / 1000;
    const hours = (route.plannedDurationSeconds ?? route.durationSeconds ?? 0) / 3600;
    return { km, hours, liters: km * litersFor(route.truck?.truckTypeId) / 100, collections: route.stops.length };
}

// What one collection uses on average (its share of the driving to and from
// the depot included), from the routes driven, or before any was, from those
// planned; null without either. `basis` says which.
export function perCollection(learningRoutes, litersFor) {
    for (const [basis, usageOf] of [["driven", drivenUsage], ["planned", plannedUsage]]) {
        const usage = learningRoutes.map(route => usageOf(route, litersFor)).filter(Boolean).reduce(addUsage, EMPTY_USAGE);
        if (usage.collections) {
            return {
                basis,
                km: usage.km / usage.collections,
                hours: usage.hours / usage.collections,
                liters: usage.liters / usage.collections,
                routeCollections: usage.collections,
            };
        }
    }
    return null;
}

// The kilograms a collection took away: weighed when the bin has a scale,
// else estimated from how full it was (full is WEIGHT_REFERENCE_KG).
export function collectionKg(collection) {
    if (collection.kgRemoved !== null) return { kg: collection.kgRemoved, isEstimate: false };
    if (collection.fullnessBefore === null) return { kg: 0, isEstimate: true };
    return { kg: collection.fullnessBefore / 100 * WEIGHT_REFERENCE_KG, isEstimate: true };
}

// One organization over the range's days (each { day }; the first and last
// partial, so `rangeDays` long in all): spent on fuel and
// the crew (the routes driven, by service day), disposal (every collection's
// tonnes at the levy and the site's fee) and the system (its month spread over
// the days); saved: the collections the old fixed schedule would have made
// (the reporting bins, `baselineCollectionsPerWeek` each) less the ones made,
// each at the fuel and crew one costs. Money in ₪, unrounded.
export function organizationMoney({ costs, fleet, days, rangeDays, routes, learningRoutes, collections, reportingBins }) {
    const litersFor = litersPer100KmOf(fleet);
    const unit = perCollection(learningRoutes, litersFor);
    const collectionCost = unit ? unit.liters * costs.dieselPerLiter + unit.hours * costs.crewPerHour : null;
    const disposalPerKg = (costs.landfillLevyPerTonne + costs.disposalFeePerTonne) / 1000;
    // Spread over the listed days, so they add up to the range.
    const dayShare = rangeDays / days.length;
    const baselinePerDay = reportingBins * costs.baselineCollectionsPerWeek / 7 * dayShare;
    const systemPerDay = costs.systemPerMonth / DAYS_PER_MONTH * dayShare;

    const usageByDay = new Map();
    for (const route of routes) {
        const usage = drivenUsage(route, litersFor);
        if (usage) usageByDay.set(route.serviceDay, addUsage(usageByDay.get(route.serviceDay) ?? EMPTY_USAGE, usage));
    }
    const collectionsByDay = new Map();
    for (const collection of collections) {
        collectionsByDay.set(collection.day, [...(collectionsByDay.get(collection.day) ?? []), collectionKg(collection)]);
    }

    const daily = days.map(({ day }) => {
        const usage = usageByDay.get(day) ?? EMPTY_USAGE;
        const ofDay = collectionsByDay.get(day) ?? [];
        const kg = ofDay.reduce((sum, collection) => sum + collection.kg, 0);
        const avoided = baselinePerDay - ofDay.length;
        return {
            day,
            usage,
            kg,
            estimatedKg: ofDay.filter(collection => collection.isEstimate).reduce((sum, collection) => sum + collection.kg, 0),
            collections: ofDay.length,
            spent: {
                fuel: usage.liters * costs.dieselPerLiter,
                crew: usage.hours * costs.crewPerHour,
                disposal: kg * disposalPerKg,
                system: systemPerDay,
            },
            avoided,
            savedMoney: collectionCost === null ? null : avoided * collectionCost,
            savedLiters: unit ? avoided * unit.liters : null,
        };
    });
    return { unit, collectionCost, baseline: baselinePerDay * days.length, reportingBins, daily };
}

const sum = (list, value) => list.reduce((total, item) => total + (value(item) ?? 0), 0);
const round = (value, decimals = 0) => value === null ? null : Math.round(value * 10 ** decimals) / 10 ** decimals;

// The range's money across organizations (each from organizationMoney, on the
// same days), rounded for the page: totals, the usage behind them, the
// collections against the old schedule, what one collection costs, and per
// day what was spent and saved. Savings stay null when no organization has a
// route to learn a collection's cost from; one that has none adds no savings.
export function combineMoney(organizations, days) {
    const daily = days.map(({ day }, index) => {
        const ofDay = organizations.map(org => org.daily[index]);
        const spent = sum(ofDay, entry => entry.spent.fuel + entry.spent.crew + entry.spent.disposal + entry.spent.system);
        const priced = ofDay.filter(entry => entry.savedMoney !== null);
        return { day, spent: round(spent), saved: priced.length ? round(sum(priced, entry => entry.savedMoney)) : null };
    });
    const entries = organizations.flatMap(org => org.daily);
    const spentOf = key => sum(entries, entry => entry.spent[key]);
    const spent = { fuel: spentOf("fuel"), crew: spentOf("crew"), disposal: spentOf("disposal"), system: spentOf("system") };
    const priced = organizations.filter(org => org.unit);
    const pricedEntries = priced.flatMap(org => org.daily);
    const savedMoney = priced.length ? sum(pricedEntries, entry => entry.savedMoney) : null;
    const savedLiters = priced.length ? sum(pricedEntries, entry => entry.savedLiters) : null;
    const actual = sum(entries, entry => entry.collections);
    const baseline = sum(organizations, org => org.baseline);
    const tonnes = sum(entries, entry => entry.kg) / 1000;
    // One collection, weighted by the route collections each organization learned it from.
    const learned = sum(priced, org => org.unit.routeCollections);
    const weighted = value => priced.length ? sum(priced, org => value(org) * org.unit.routeCollections) / learned : null;

    return {
        spent: {
            fuel: round(spent.fuel), crew: round(spent.crew), disposal: round(spent.disposal), system: round(spent.system),
            total: round(spent.fuel + spent.crew + spent.disposal + spent.system),
        },
        usage: {
            km: round(sum(entries, entry => entry.usage.km), 1),
            crewHours: round(sum(entries, entry => entry.usage.hours), 1),
            liters: round(sum(entries, entry => entry.usage.liters), 1),
            routeCollections: sum(entries, entry => entry.usage.collections),
            tonnes: round(tonnes, 2),
            estimatedTonnes: round(sum(entries, entry => entry.estimatedKg) / 1000, 2),
        },
        collections: {
            bins: sum(organizations, org => org.reportingBins),
            actual,
            baseline: round(baseline),
            avoided: round(baseline - actual),
        },
        perCollection: priced.length ? {
            basis: priced.some(org => org.unit.basis === "planned") ? "planned" : "driven",
            cost: round(weighted(org => org.collectionCost), 1),
            km: round(weighted(org => org.unit.km), 2),
            liters: round(weighted(org => org.unit.liters), 2),
            minutes: round(weighted(org => org.unit.hours * 60), 1),
        } : null,
        saved: {
            money: round(savedMoney),
            liters: round(savedLiters, 1),
            co2Kg: savedLiters === null ? null : round(savedLiters * CO2_KG_PER_DIESEL_LITER),
            // Less what the system costs the organizations it saved for.
            net: savedMoney === null ? null : round(savedMoney - sum(pricedEntries, entry => entry.spent.system)),
        },
        daily,
    };
}
