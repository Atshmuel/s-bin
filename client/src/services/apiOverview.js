
import { OVERVIEW_EP, SERVER_URL } from "@/utils/constants";

export async function getOverviews() {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getBinsStatusOverviews() {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}/binstatus`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getAIOverviewStream() {
    const useMock = true;
    if (useMock) {
        const resp = await fetch('../../public/data.json');
        return await resp.json();
    }

    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}/ai-ov`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}
export async function getLogTypeOverviews() {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}/logtype`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}