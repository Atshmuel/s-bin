import { getAICache, setAICache } from '../utils/aiCache';
import { OVERVIEW_EP } from "@/utils/constants";
import { request } from "./request";

export function getBinsStatusOverviews() {
    return request(`${OVERVIEW_EP}/binstatus`);
}

export async function getAIOverviewStream() {
    const cached = getAICache()
    if (cached) return cached

    const data = await request(`${OVERVIEW_EP}/ai-ov`);
    setAICache(data)
    return data;
}

export function getLogTypeOverviews() {
    return request(`${OVERVIEW_EP}/logtype`);
}
