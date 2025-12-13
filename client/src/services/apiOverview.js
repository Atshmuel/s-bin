
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