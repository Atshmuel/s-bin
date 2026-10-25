import mongoose from "mongoose";
import { organizationModel } from "../models/models.js";
import { deleteOrgRefs } from "../service/sharedService.js";
import { MAX_MESH_AWAKE_WINDOW_SECONDS, REPORT_INTERVAL_OPTIONS_MINUTES } from "../../utils/constants.js";
import { ROLES } from "../../utils/constants.js";

const MESH_SETTINGS_PROJECTION = {
    name: 1, meshAwakeWindowSeconds: 1, reportIntervalMinutes: 1, reportStartHour: 1, fleet: 1, depot: 1, routePlanningHour: 1, lastAutoPlan: 1,
};


export async function getOrganizations(req, res) {
    const { id } = req.params;
    let query = {};
    if (id) {
        query._id = id;
    }
    try {
        const orgs = await organizationModel.find(query, { __v: 0 })
        return res.status(200).json(orgs);
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'getOrganizations'" });
    }
}

export async function createOrganization(req, res) {
    const { name } = req.body;
    try {
        const newOrg = await organizationModel.create({ name });
        return res.status(201).json(newOrg);
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'createOrganization'" });
    }
}

export async function removeOrganization(req, res) {
    const { id } = req.params;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const deletion = await deleteOrgRefs(id);

        return res.status(201).json({ message: 'Organization removed successfully', deletion });
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'removeOrganization'" });
    }
}

export async function updateOrganization(req, res) {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const updatedOrg = await organizationModel.findByIdAndUpdate(id, { name }, { new: true });
        return res.status(201).json(updatedOrg);
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'updateOrganization'" });
    }
}

// Owners manage every organization's mesh settings; admins only their own.
export async function getMeshSettings(req, res) {
    const { role, org } = req.user;
    const query = role === ROLES.OWNER ? {} : { _id: org };
    try {
        const organizations = await organizationModel.find(query, MESH_SETTINGS_PROJECTION)
            .sort({ name: 1 });
        return res.status(200).json({ organizations });
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'getMeshSettings'" });
    }
}

export async function updateMeshSettings(req, res) {
    const { orgId } = req.params;
    const { meshAwakeWindowSeconds, reportIntervalMinutes, reportStartHour } = req.body ?? {};
    const { role, org } = req.user;

    if (!mongoose.Types.ObjectId.isValid(orgId)) {
        return res.status(400).json({ message: "Invalid organization ID." });
    }
    if (role !== ROLES.OWNER && orgId !== org) {
        return res.status(403).json({ message: "You can only change your own organization's settings." });
    }
    if (meshAwakeWindowSeconds === undefined && reportIntervalMinutes === undefined && reportStartHour === undefined) {
        return res.status(400).json({
            message: "Nothing to update: send meshAwakeWindowSeconds, reportIntervalMinutes and/or reportStartHour."
        });
    }
    if (meshAwakeWindowSeconds !== undefined &&
        (!Number.isInteger(meshAwakeWindowSeconds) ||
            meshAwakeWindowSeconds < 1 ||
            meshAwakeWindowSeconds > MAX_MESH_AWAKE_WINDOW_SECONDS)) {
        return res.status(400).json({
            message: `meshAwakeWindowSeconds must be an integer between 1 and ${MAX_MESH_AWAKE_WINDOW_SECONDS}.`
        });
    }
    if (reportIntervalMinutes !== undefined && !REPORT_INTERVAL_OPTIONS_MINUTES.includes(reportIntervalMinutes)) {
        return res.status(400).json({
            message: `reportIntervalMinutes must be one of ${REPORT_INTERVAL_OPTIONS_MINUTES.join(", ")}.`
        });
    }
    if (reportStartHour !== undefined &&
        (!Number.isInteger(reportStartHour) || reportStartHour < 0 || reportStartHour > 23)) {
        return res.status(400).json({ message: "reportStartHour must be an integer between 0 and 23." });
    }

    try {
        const organization = await organizationModel.findByIdAndUpdate(
            orgId,
            {
                $set: {
                    ...(meshAwakeWindowSeconds === undefined ? {} : { meshAwakeWindowSeconds }),
                    ...(reportIntervalMinutes === undefined ? {} : { reportIntervalMinutes }),
                    ...(reportStartHour === undefined ? {} : { reportStartHour }),
                }
            },
            { new: true, runValidators: true, projection: MESH_SETTINGS_PROJECTION }
        );
        if (!organization) {
            return res.status(404).json({ message: "Organization not found." });
        }
        return res.status(200).json({ organization });
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Internal server error 'updateMeshSettings'" });
    }
}

// The organization's trucks, depot and nightly planning hour, which its routes
// are planned with: owners for any organization, admins for their own.
// `fleet` replaces the whole list; `depot` is { location: [lng, lat], address }
// or null; `routePlanningHour` is a local hour (0-23) or null (no nightly plan).
export async function updateFleetSettings(req, res) {
    const { id } = req.params;
    const { fleet, depot, routePlanningHour } = req.body ?? {};
    const { role, org } = req.user;

    if (role !== ROLES.OWNER && id !== org) {
        return res.status(403).json({ message: "You can only change your own organization's settings." });
    }
    if (fleet !== undefined && !Array.isArray(fleet)) {
        return res.status(400).json({ message: "fleet must be a list of truck types." });
    }
    if (depot !== undefined && depot !== null && typeof depot !== "object") {
        return res.status(400).json({ message: "depot must be { location: [lng, lat], address } or null." });
    }

    try {
        const organization = await organizationModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...(fleet === undefined ? {} : {
                        fleet: fleet.map(({ _id, name, preset, count, capacityKg }) => ({
                            ...(mongoose.Types.ObjectId.isValid(_id) ? { _id } : {}), name, preset, count, capacityKg,
                        })),
                    }),
                    ...(depot === undefined ? {} : { depot: depot && { location: depot.location, address: depot.address ?? "" } }),
                    ...(routePlanningHour === undefined ? {} : { routePlanningHour }),
                },
            },
            { new: true, runValidators: true, projection: MESH_SETTINGS_PROJECTION }
        );
        if (!organization) return res.status(404).json({ message: "Organization not found." });
        return res.status(200).json({ organization });
    } catch (error) {
        if (error?.name === "ValidationError" || error?.name === "CastError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: error?.message || "Internal server error 'updateFleetSettings'" });
    }
}
