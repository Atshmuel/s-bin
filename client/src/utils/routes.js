import { truckName } from "@/utils/orgSettings"

// "Medium truck #2", or the route type when it has no truck.
export function routeTitle(route, t) {
    return route.truck
        ? t("pages.routes.truckUnit", { name: truckName(route.truck, t), unit: route.truck.unit })
        : t(`mapLegend.route.${route.type}`)
}

// "1 h 25 min" from seconds.
export function routeDuration(seconds, t) {
    return t("mapLegend.route.summaryTime", { hours: Math.floor(seconds / 3600), minutes: Math.round(seconds % 3600 / 60) })
}
