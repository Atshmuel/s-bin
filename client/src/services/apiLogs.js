import { LOGS_EP, SERVER_URL } from "@/utils/constants";

export async function getAllLogs(page = 1, limit = 10, search = "") {
    const res = await fetch(`${SERVER_URL}/${LOGS_EP}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getLog({ id, withBin }) {
    const res = await fetch(`${SERVER_URL}/${LOGS_EP}/${id}?withBin=${withBin}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}