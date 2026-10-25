import { truckName } from "@/utils/orgSettings"

// "Medium truck #2", or the route type when it has no truck.
export function routeTitle(route, t) {
    return route.truck
        ? t("pages.routes.truckUnit", { name: truckName(route.truck, t), unit: route.truck.unit })
        : t(`mapLegend.route.${route.type}`)
}

// What is in the truck so far, about: the planned load of the stops done (a
// bin's load was estimated from its weight or fullness when planned).
export function loadedKg(route) {
    return route.stops.reduce((sum, stop) => sum + (stop.status === "done" ? stop.loadKg ?? 0 : 0), 0)
}

// "1 h 25 min", or "8 min" under an hour, from seconds.
export function routeDuration(seconds, t) {
    const hours = Math.floor(seconds / 3600), minutes = Math.round(seconds % 3600 / 60)
    return hours ? t("mapLegend.route.summaryTime", { hours, minutes }) : t("mapLegend.route.summaryMinutes", { minutes })
}
