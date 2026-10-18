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
