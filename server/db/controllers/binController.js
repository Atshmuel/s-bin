import mongoose from 'mongoose'
import { binModel } from '../models/models.js'
import { appendFilter, generateRandomToken } from '../../utils/helpers.js'
import { deleteLogsForBins, getUserShared } from '../service/sharedService.js'
import { removeBinConfig } from '../../mqtt/mqttHandlers.js';


export async function getBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user
    const { withLogs } = req.query

    let query = {}
    query = appendFilter(query, true, '_id', new mongoose.Types.ObjectId(id))
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    const pipeline = [
        { $match: query }
    ]
    if (withLogs) {
        pipeline.push({
            $lookup: {
                from: 'binlogs',
                localField: '_id',
                foreignField: 'binId',
                as: 'logs'
            }
        })
    }

    try {
        const binData = await binModel.aggregate(pipeline);

        if (!binData) return res.status(404).json({ message: "Bin not found." });

        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUserBins(req, res) {
    const { id: ownerId, role } = req.user
    const { withLogs } = req.query

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    const pipeline = [
        { $match: query }
    ]
    if (withLogs) {
        pipeline.push({
            $lookup: {
                from: 'binlogs',
                localField: '_id',
                foreignField: 'binId',
                as: 'logs'
            }
        })
    }

    try {
        const binsData = await binModel.aggregate(pipeline);
        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getBinsByStatus(req, res) {
    const { id: ownerId, role } = req.user
    const { level, health } = req.body

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)
    query = appendFilter(query, level && typeof level === 'number', 'status.level', { $gt: level })
    query = appendFilter(query, health && Array.isArray(health), 'status.health', { $in: health })

    try {
        const binsData = await binModel.find(query)
        res.status(200).json({ binsData: binsData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getBinsInUserRadius(req, res) {
    const { id: ownerId, role } = req.user
    const { coordinates, radius, health, minLevel, maxLevel } = req.body
    if (!coordinates || !Array.isArray(coordinates) || !coordinates.every(el => typeof el === "number")) return res.status(400).json({ message: 'Coordinates is mandatory! (schema: coordinates:{[lat,lng]})' })

    if (!radius || typeof radius !== "number") return res.status(400).json({ message: 'Radius is mandatory!' })

    let query = {};
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
    query = appendFilter(query, health && health !== "all", 'status.health', health)
    if (minLevel !== undefined || maxLevel !== undefined) {
        query['status.level'] = {
            $gte: minLevel !== undefined ? Number(minLevel) : 0,
            $lte: maxLevel !== undefined ? Number(maxLevel) : 100
        };
    }

    try {
        let binsData = await binModel.aggregate(
            [
                {
                    $geoNear: {
                        near: { type: "Point", coordinates },
                        distanceField: "distance",
                        spherical: true,
                        maxDistance: radius,
                        query,
                    }
                },
            ]
        )

        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function updateBinMaintenance(req, res) {
    const { id } = req.params
    const { id: technicianId } = req.user
    const { notes } = req.body
    try {
        const bin = await binModel.findById(id)
        if (!bin) return res.status(404).json({ message: 'Bin not found' });

        await bin.recordService(notes, technicianId);
        return res.json({ message: 'Service recorded', maintenance: bin.maintenance });

    } catch (error) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

/* unimplemented functions
export async function updateBinName(req,res){
// if we want to allow updating device name we can implement this function in the future but need to keep in mind to send the new name to the device for it to update its config
}

export async function updateBinDeviceKey(req, res) {
    // if will be used in the future we need to send the new key to the device for it to update its config
    const { id } = req.params
    const { id: ownerId, role } = req.user

    let filter = {}
    filter = appendFilter(filter, true, '_id', id)
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    try {
        const { deviceKey } = await binModel.findOneAndUpdate(filter, { $set: { deviceKey: generateRandomToken() } }, { new: true, runValidators: true }).select('deviceKey -_id')

        if (!deviceKey) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ deviceKey })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

*/

export async function deleteBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)
    query = appendFilter(query, true, '_id', id)

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const deleteBinResult = await binModel.findOneAndDelete(query, { session });
        if (!deleteBinResult) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Bin not found or access denied" });
        }

        const deleteLogsResult = await deleteLogsForBins([id], session)

        removeBinConfig(deleteBinResult.macAddress)

        await session.commitTransaction();
        return res.status(200).json({
            message: 'Bins and logs deleted successfully',
            deletedLogs: deleteLogsResult
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to delete bin:", error);
        return res.status(500).json({ message: "Failed to delete bin", error: error.message });
    }
    finally {
        session.endSession();
    }
}

export async function deleteBinsBatch(req, res) {

    const { id: ownerId, role } = req.user
    const binIds = req.binIds

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)
    query = appendFilter(query, true, '_id', { $in: binIds })

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const binsToDelete = await binModel.find(query, "_id", { session });
        const binsToDeleteIds = binsToDelete.map(b => b._id);

        if (binsToDeleteIds.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "No bins found to delete or access denied" });
        }

        const deleteBinsResult = await binModel.deleteMany({ _id: { $in: binsToDeleteIds } }, { session });
        const deleteLogsResult = await deleteLogsForBins(binsToDeleteIds, session)

        binsToDelete.forEach(bin => {
            removeBinConfig(bin.macAddress);
        })
        await session.commitTransaction();

        return res.status(200).json({
            message: 'Bins and logs deleted successfully',
            deletedBins: deleteBinsResult.deletedCount,
            deletedLogs: deleteLogsResult
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Failed to delete bins batch:", error);
        return res.status(500).json({ message: "Failed to delete bins batch", error: error.message });
    }
    finally {
        session.endSession();
    }
}
