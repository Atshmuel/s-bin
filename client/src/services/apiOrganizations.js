import { ORG_EP } from "@/utils/constants";
import { request } from "./request";

export function getOrganizations() {
    return request(ORG_EP);
}

export function createOrgApi({ name }) {
    return request(ORG_EP, { method: "POST", body: { name } });
}

export function deleteOrgByIdApi({ orgId }) {
    return request(`${ORG_EP}/${orgId}`, { method: "DELETE" });
}

export function updateOrgNameApi({ orgId, name }) {
    return request(`${ORG_EP}/${orgId}`, { method: "PUT", body: { name } });
}

// The organization's trucks and depot: `fleet` replaces the list, `depot` is
// { location: [lng, lat], address } or null.
export function updateFleetSettingsApi({ orgId, ...settings }) {
    return request(`${ORG_EP}/${orgId}/fleet`, { method: "PATCH", body: settings });
}

// The organization's map: { clusterUntilZoom }, within CLUSTER_ZOOM_RANGE.
export function updateMapSettingsApi({ orgId, ...settings }) {
    return request(`${ORG_EP}/${orgId}/map`, { method: "PATCH", body: settings });
}

// The organization's fullness and battery cut-offs: any of THRESHOLD_SETTINGS' fields.
export function updateThresholdSettingsApi({ orgId, ...thresholds }) {
    return request(`${ORG_EP}/${orgId}/thresholds`, { method: "PATCH", body: thresholds });
}

// A new device registration code for the organization.
export function regenerateRegistrationCodeApi({ orgId }) {
    return request(`${ORG_EP}/${orgId}/registration-code`, { method: "POST" });
}

// What collecting costs the organization: any of COST_SETTINGS' fields.
export function updateCostSettingsApi({ orgId, ...costs }) {
    return request(`${ORG_EP}/${orgId}/costs`, { method: "PATCH", body: costs });
}
