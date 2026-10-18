import { BINS_EP } from "@/utils/constants";
import { request } from "./request";

//get bins
export function getAllUserBins(page = 1, limit = 10, search = "") {
    return request(`${BINS_EP}/all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
}

export function getBin({ id, withLogs }) {
    return request(`${BINS_EP}/${id}?withLogs=${withLogs}`);
}

export function getBinsInUserRadius({ coordinates, radius, health = null, minLevel = null, maxLevel = null }) {
    return request(`${BINS_EP}/radius`, {
        method: "POST",
        body: { coordinates, radius: +radius * 1000, health, minLevel, maxLevel },
    });
}

export function getBestRoute({ coordinates, radius, type, byFoot }) {
    return request(`${BINS_EP}/route`, {
        method: "POST",
        body: { coordinates: coordinates.split(',').map(Number), radius: +radius * 1000, type, byFoot },
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
