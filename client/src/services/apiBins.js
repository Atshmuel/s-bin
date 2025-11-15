import { BINS_EP, SERVER_URL } from "@/utils/constants";

//get bins
export async function getAllUserBins() {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/all`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function getBin({ id }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/${id}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getBinsInUserRadius({ id, coordinates, radius, health = null, minLevel = null, maxLevel = null }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/radius/${id}`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, coordinates, radius, health, minLevel, maxLevel }),
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

export async function deleteBin({ id }) {
    const res = await fetch(`${SERVER_URL}/${BINS_EP}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}