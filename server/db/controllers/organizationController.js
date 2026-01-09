import { organizationModel } from "../models/models.js";


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
    try {
        const deletion = await organizationModel.findByIdAndDelete(id);
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