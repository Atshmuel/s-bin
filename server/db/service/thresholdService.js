import { organizationModel } from "../models/models.js";
import { ROLES } from "../../utils/constants.js";
import { thresholdsOf } from "../../utils/thresholds.js";

// The organizations' fullness and battery cut-offs, read for the devices a
// request looks at (see utils/thresholds.js).

// The cut-offs of the organizations in the user's scope, by id: an owner's
// picked one, or all of them; anyone else's own.
export async function scopedThresholds({ role, org, selectedOrg }) {
    const query = role === ROLES.OWNER ? (selectedOrg ? { _id: selectedOrg } : {}) : { _id: org };
    return thresholdsByOrganization(query);
}

// The cut-offs of the organizations a query matches, by id.
export async function thresholdsByOrganization(query = {}) {
    const organizations = await organizationModel.find(query, { thresholds: 1 }).lean();
    return new Map(organizations.map(organization => [String(organization._id), thresholdsOf(organization)]));
}

// One organization's cut-offs.
export async function organizationThresholds(orgId) {
    return thresholdsOf(await organizationModel.findById(orgId, { thresholds: 1 }).lean());
}
