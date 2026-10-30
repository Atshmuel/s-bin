import { organizationModel } from "../models/models.js";
import { MESH_KEY_ID_COUNT } from "../../utils/constants.js";
import { generateMeshKey } from "../../utils/meshKeys.js";

// An organization's mesh key (2m; see utils/meshKeys.js): made when first
// needed, handed to its gateways, never shown. This is the only place that
// reads it: the key and its generation are left out of every query.

const readKey = orgId => organizationModel.findById(orgId).select("+meshKey +meshKeyId").lean();

// { meshKey, meshKeyId } of the organization, made on first use; null for an
// organization that does not exist.
export async function ensureMeshKey(orgId) {
    let organization = await readKey(orgId);
    if (organization && !organization.meshKey) {
        // Two gateways asking at once make one key: the update lands only while there is none.
        await organizationModel.updateOne(
            { _id: orgId, meshKey: { $exists: false } },
            { $set: { meshKey: generateMeshKey(), meshKeyId: 1 } },
        );
        organization = await readKey(orgId);
    }
    return organization?.meshKey ? { meshKey: organization.meshKey, meshKeyId: organization.meshKeyId } : null;
}

// A new key for the organization, one generation on (they wrap from 255 to 1).
// Its gateways take it with their next report and still accept the one before;
// every leaf needs its keys made again.
export async function rotateMeshKey(orgId) {
    await organizationModel.updateOne({ _id: orgId }, [{
        $set: {
            meshKey: generateMeshKey(),
            meshKeyId: { $add: [{ $mod: [{ $ifNull: ["$meshKeyId", 0] }, MESH_KEY_ID_COUNT] }, 1] },
        },
    }]);
    return ensureMeshKey(orgId);
}

// What to add to a gateway's ack: the current key, unless the generation it
// reported holding is the current one. A gateway with no key reports none (0).
export async function meshKeyUpdateFor(orgId, reportedKeyId) {
    const current = await ensureMeshKey(orgId);
    if (!current || current.meshKeyId === reportedKeyId) return {};
    return current;
}
