import { BINS_EP } from "@/utils/constants";
import { request } from "./request";

//get bins
export function getAllUserBins(page = 1, limit = 10, search = "", sort = null) {
    const order = sort ? `&sort=${sort.sort}&order=${sort.order}` : "";
    return request(`${BINS_EP}/all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${order}`);
}

// A map view: { total, bins } (marker fields only), or for a crowded view
// { total, cells } with a count per grid cell.
export function getMapBins({ south, west, north, east, zoom }) {
    return request(`${BINS_EP}/map?${new URLSearchParams({ south, west, north, east, zoom })}`);
}

// The box around all the user's devices, where the map opens: { extent }.
export function getMapExtent() {
    return request(`${BINS_EP}/map/extent`);
}

export function getBin({ id }) {
    return request(`${BINS_EP}/${id}`);
}

export function getBinsInUserRadius({ coordinates, radius, health = null, minLevel = null, maxLevel = null }) {
    return request(`${BINS_EP}/radius`, {
        method: "POST",
        body: { coordinates, radius: +radius * 1000, health, minLevel, maxLevel },
    });
}

// The route visits the bins the map's search finds: a collection those in the
// fullness range, a maintenance visit those in the health filter.
export function getBestRoute({ coordinates, radius, type, byFoot, minLevel, maxLevel, health }) {
    return request(`${BINS_EP}/route`, {
        method: "POST",
        body: { coordinates: coordinates.split(',').map(Number), radius: +radius * 1000, type, byFoot, minLevel, maxLevel, health },
    });
}
//end

export function updateBinMaintenance({ id, notes }) {
    return request(`${BINS_EP}/maintenance/${id}`, { method: "PATCH", body: { notes } });
}

export function updateBinName({ id, name }) {
    return request(`${BINS_EP}/name/${id}`, { method: "PATCH", body: { name } });
}

export function deleteBinsBatch({ binIds = [] }) {
    return request(BINS_EP, { method: "DELETE", body: { binIds } });
}

export function deleteBinById({ id }) {
    return request(`${BINS_EP}/${id}`, { method: "DELETE" });
}

export function deleteBinViaMac(macId) {
    return request(`${BINS_EP}/mac/${macId}`, { method: "DELETE" });
}
