import { LOGS_EP, SERVER_URL } from "@/utils/constants";

export async function getAllLogs() {
    const res = await fetch(`${SERVER_URL}/${LOGS_EP}`, {
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