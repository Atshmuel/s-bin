import { ROUTES_EP } from "@/utils/constants";
import { request } from "./request";

// A day's routes ({ serviceDay, routes }): `day` is YYYY-MM-DD (today in the
// organization's time zone when left out), `org` an owner's organization.
export function getRoutes({ day, org, status } = {}) {
    const params = new URLSearchParams(Object.entries({ day, org, status }).filter(([, value]) => value));
    return request(`${ROUTES_EP}${params.size ? `?${params}` : ""}`);
}

export function getRoute({ id }) {
    return request(`${ROUTES_EP}/${id}`);
}

// The active drivers a route of the organization can be given.
export function getRouteDrivers({ org }) {
    return request(`${ROUTES_EP}/drivers${org ? `?org=${org}` : ""}`);
}

// Plans and stores a route: { route } (null with a `reason` when nothing matched or fitted).
export function createRoute(body) {
    return request(ROUTES_EP, { method: "POST", body });
}

// Changes a route: { driverId }, { truckTypeId } or { status: "cancelled" }.
export function updateRoute({ id, ...changes }) {
    return request(`${ROUTES_EP}/${id}`, { method: "PATCH", body: changes });
}
