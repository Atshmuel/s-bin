import { getAICache, setAICache } from '../utils/aiCache';
import { OVERVIEW_EP } from "@/utils/constants";
import { request } from "./request";

// An owner's picked organization narrows every overview (?org=<id>).
function orgQuery(orgId) {
    return orgId ? `?${new URLSearchParams({ org: orgId })}` : "";
}

export function getBinsStatusOverviews(orgId) {
    return request(`${OVERVIEW_EP}/binstatus${orgQuery(orgId)}`);
}

export async function getAIOverviewStream(orgId) {
    const cached = getAICache(orgId)
    if (cached) return cached

    const data = await request(`${OVERVIEW_EP}/ai-ov${orgQuery(orgId)}`);
    setAICache(data, orgId)
    return data;
}

export function getLogTypeOverviews(orgId) {
    return request(`${OVERVIEW_EP}/logtype${orgQuery(orgId)}`);
}
