import { BINS_EP } from "@/utils/constants";
import { request } from "./request";

export function getMeshSettings() {
    return request(`${BINS_EP}/mesh-settings`);
}

export function updateMeshSettings({ orgId, meshAwakeWindowSeconds, reportIntervalMinutes, reportStartHour }) {
    return request(`${BINS_EP}/mesh-settings/${orgId}`, {
        method: "PATCH",
        body: { meshAwakeWindowSeconds, reportIntervalMinutes, reportStartHour },
    });
}
