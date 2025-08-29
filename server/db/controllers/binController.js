import mongoose from 'mongoose'
import { binModel } from '../models/models.js'

export async function createBin(req, res) {
    const { binCode, location } = req.body
    if (!binCode || !location)
        res.status(400).json({ message: 'binCode(name), Location are mandatory !' })


    try {
        const newData = await binModel.create({ binCode, location })
        res.status(201).json({ bin: newData })
    } catch (error) {
        res.status(400).json({ message: error?.message || error })
    }
}

export async function createBinsBatch(req, res) {
    const binsBatch = req.body //array of bins
    if (!binsBatch.length) return res.status(400).json({ message: 'Array of binCode(name), Location are mandatory !' })
    for (let bin of binsBatch) {
        const { binCode, location } = bin
        if (!binCode || !location) throw Error('binCode(name), Location are mandatory !')
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const newBinsBatch = await binModel.insertMany(binsBatch, { session })
        await session.commitTransaction();
        session.endSession();
        session.endSession();

        res.status(201).json({ bins: newBinsBatch })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error?.message || error })
    }
}

export async function updateBin(req, res) {
    const { id } = req.params
    const updateData = req.body
    const fieldsToUpdate = {};


    if (updateData.location) {
        fieldsToUpdate.location = {};
        if (updateData.location.lat !== undefined) {
            fieldsToUpdate.location.lat = updateData.location.lat;
        }
        if (updateData.location.lng !== undefined) {
            fieldsToUpdate.location.lng = updateData.location.lng;
        }
    }
    if (updateData.status) {
        fieldsToUpdate.status = {};
        if (updateData.status.health) {
            fieldsToUpdate.status.health = updateData.status.health;
        }
        if (updateData.status.level !== undefined) {
            fieldsToUpdate.status.level = updateData.status.level;
        }
        fieldsToUpdate.status.updatedAt = new Date();
    }


    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update." });
    }

    try {
        const updatedBin = await binModel.findByIdAndUpdate(id, { $set: fieldsToUpdate }, { new: true, runValidators: true })

        if (!updatedBin) {
            return res.status(404).json({ message: "Bin not found." });
        }

        res.status(200).json({ updateData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}
