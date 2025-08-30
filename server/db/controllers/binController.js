import mongoose from 'mongoose'
import { binModel } from '../models/models.js'

export async function getBin(req, res) {
    const { id } = req.params;
    const { id: ownerId } = req.user

    try {
        const binData = await binModel.findOne({ _id: id, ownerId })
        if (!binData) return res.status(404).json({ message: "Bin not found." });

        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUserBins(req, res) {
    const { id: ownerId } = req.user

    try {
        const binsData = await binModel.find({ ownerId })
        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
export async function getOwnerBin(req, res) {
    const { id } = req.params;

    try {
        const binData = await binModel.findById(id)
        if (!binData) return res.status(404).json({ message: "Bin not found." });
        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
//owner usage
export async function getOwnerAllBins(req, res) {
    try {
        const binsData = await binModel.find({})
        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function createBin(req, res) {
    const { id: ownerId } = req.user
    const { binCode, location } = req.body
    if (!binCode || !location)
        return res.status(400).json({ message: 'binCode(name), Location are mandatory !' })
    try {
        const newData = await binModel.create({ binCode, location, ownerId })
        res.status(201).json({ bin: newData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function createBinsBatch(req, res) {
    const { id: ownerId } = req.user

    const binsBatch = req.body //array of bins
    if (!binsBatch.length) return res.status(400).json({ message: 'Array of binCode(name), Location are mandatory !' })

    if (!binsBatch.every(bin => bin.binCode && bin.location)) {
        return res.status(400).json({ message: 'All bins must have binCode and location!' });
    }

    const binsWithOwnerId = binsBatch.map(bin => ({ ...bin, ownerId }));

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const newBinsBatch = await binModel.insertMany(binsWithOwnerId, { session })
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ bins: newBinsBatch })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error?.message || error })
    }
}

export async function updateBin(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user

    const updateData = req.body
    const fieldsToUpdate = {};


    if (updateData.location) {
        fieldsToUpdate.location = {};
        const { lat, lng } = updateData.location
        if (lat !== undefined) fieldsToUpdate.location.lat = lat;
        if (lng !== undefined) fieldsToUpdate.location.lng = lng;
    }

    if (updateData.status) {
        const { health, level } = updateData.status
        fieldsToUpdate.status = {};
        if (health !== undefined) fieldsToUpdate.status.health = health;
        if (level !== undefined) fieldsToUpdate.status.level = level;
        fieldsToUpdate.status.updatedAt = new Date();
    }


    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update." });
    }

    try {
        let updatedBin = null
        if (role === process.env.ROLE_OWNER) {
            updatedBin = await binModel.findById(id, { $set: fieldsToUpdate }, { new: true, runValidators: true })
        } else {
            updatedBin = await binModel.findOneAndUpdate({ _id: id, ownerId }, { $set: fieldsToUpdate }, { new: true, runValidators: true })

        }

        if (!updatedBin) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ updatedBin })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}


export async function deleteBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user

    try {
        let deleted = null
        if (role === process.env.ROLE_OWNER) {
            deleted = await binModel.findOneAndDelete({ _id: id })
        } else {
            deleted = await binModel.findOneAndDelete({ _id: id, ownerId })
        }
        if (!deleted) {
            return res.status(404).json({ message: "Bin not found or not owned by you." });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}