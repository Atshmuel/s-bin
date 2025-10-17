import mongoose from 'mongoose'
import { binModel } from '../models/models.js'
import { appendFilter, generateRandomToken } from '../../utils/helpers.js'
import { deleteLogsForBins, updateBinHealthShared, updateBinLevelShared, updateBinLocationShared } from '../service/sharedService.js'


export async function getBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user
    let query = {}
    query = appendFilter(query, true, '_id', id)
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    try {
        let binQuery = binModel.findOne(query);
        const binData = await binQuery;
        if (!binData) return res.status(404).json({ message: "Bin not found." });

        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUserBins(req, res) {
    const { id: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    try {
        let binsQuery = binModel.find(query);
        const binsData = await binsQuery;
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
    const { coordinates, radius, health } = req.body
    if (!coordinates || !Array.isArray(coordinates) || !coordinates.every(el => typeof el === "number")) return res.status(400).json({ message: 'Coordinates is mandatory! (schema: coordinates:{[lat,lng]})' })

    if (!radius || typeof radius !== "number") return res.status(400).json({ message: 'Radius is mandatory!' })

    let query = {};
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
    query = appendFilter(query, health && health !== "all", 'status.health', health)

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

export async function createBin(req, res) {
    const { id: ownerId } = req.user
    const { binName, location } = req.body
    if (!binName || !location)
        return res.status(400).json({ message: 'binName, Location are mandatory !' })
    try {
        const deviceKey = generateRandomToken()
        const newData = await binModel.create({ binName, location, ownerId, deviceKey })
        res.status(201).json({ bin: newData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function createBinsBatch(req, res) {
    const { id: ownerId } = req.user

    const binsBatch = req.body //array of bins
    if (!binsBatch.length) return res.status(400).json({ message: 'Array of binName(name), Location are mandatory !' })

    if (!binsBatch.every(bin => bin.binName && bin.location)) {
        return res.status(400).json({ message: 'All bins must have binName and location!' });
    }

    if (binsBatch.every(bin => bin.level && bin.status)) {
        return res.status(400).json({ message: "Cant create Bins with level or status!" });
    }

    const binsWithOwnerId = binsBatch.map((bin) => {
        const deviceKey = generateRandomToken()
        return { ...bin, ownerId, deviceKey }
    });


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

export async function updateBinLocation(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user
    const { location } = req.body

    let filter = {}
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    if (!location || !Array.isArray(location) || location.length !== 2 || !location.every(n => typeof n === "number")) {
        return res.status(400).json({
            message: "Location is mandatory and must be an array of 2 numbers [lng, lat]."
        });
    }

    await updateBinLocationShared(id, location, filter)

}
export async function updateBinHealth(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user
    const { health } = req.body

    let filter = {}
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    if (!health || typeof health !== 'string' || !["good", "warning", "critical"].includes(health.toLowerCase())) {
        return res.status(400).json({
            message: "health is mandatory and must be one of 'good', 'warning', 'critical'."
        });
    }

    await updateBinHealthShared(id, health, filter)
}
export async function updateBinLevel(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user
    const { level } = req.body

    let filter = {}
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    if ((!level || typeof level !== 'number') && (level >= 0 && level <= 100)) {
        return res.status(400).json({
            message: "level is mandatory and must be between 0-100"
        });
    }

    await updateBinLevelShared(id, level, filter)
}
export async function updateBinMaintenance(req, res) {
    const { id } = req.params
    const { notes, technicianId } = req.body
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
export async function updateBinDeviceKey(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user

    let filter = {}
    filter = appendFilter(filter, true, '_id', id)
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', ownerId)

    try {
        const newKey = await binModel.findOneAndUpdate(filter, { $set: { deviceKey: generateRandomToken() } }, { new: true, runValidators: true }).select('deviceKey')

        if (!newKey) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ newKey })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

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
