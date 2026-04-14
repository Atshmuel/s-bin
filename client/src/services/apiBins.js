import { BINS_EP, SERVER_URL } from "@/utils/constants";

//get bins
export async function getAllUserBins(page = 1, limit = 10, search = "") {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/all?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function getBin({ id, withLogs }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/${id}?withLogs=${withLogs}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getBinsInUserRadius({ coordinates, radius, health = null, minLevel = null, maxLevel = null }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/radius`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates, radius: +radius * 1000, health, minLevel, maxLevel }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getBestRoute({ coordinates, radius, type, byFoot }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/route`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: coordinates.split(',').map(Number), radius: +radius * 1000, type, byFoot }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getUserBinsByStatus({ health, level }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/status`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, health }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
//end 


export async function updateBinMaintenance({ id, notes }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/maintenance/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function updateBinName({ id, name }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/name/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function deleteBinsBatch({ binIds = [] }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}`, {
        method: "DELETE",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ binIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function deleteBinById({ id }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}


export async function deleteBinViaMac(macId) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/mac/${macId}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}