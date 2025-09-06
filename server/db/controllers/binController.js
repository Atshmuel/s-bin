import mongoose from 'mongoose'
import { binModel } from '../models/models.js'

export async function getBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user
    const { level } = req.query

    const query = { _id: id }

    if (role !== process.env.ROLE_OWNER) {
        query.ownerId = ownerId
    }

    try {
        let binData = null
        if (level === 'true') {
            binData = await binModel.findOne(query).populate('levelLogs')
        } else {
            binData = await binModel.findOne(query)
        }
        if (!binData) return res.status(404).json({ message: "Bin not found." });

        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUserBins(req, res) {
    const { id: ownerId, role } = req.user
    const { level } = req.query
    const query = {}

    if (role !== process.env.ROLE_OWNER) {
        query.ownerId = ownerId
    }


    try {
        let binsData = null
        if (level === 'true') {
            binsData = await binModel.find(query).populate('levelLogs')
        } else {
            binsData = await binModel.find(query)
        }
        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getBinsByStatus(req, res) {
    const { id: ownerId, role } = req.user
    const { level, health } = req.body
    const query = {}

    if (role !== process.env.ROLE_OWNER) {
        query.ownerId = ownerId
    }

    if (level && typeof level === 'number') {
        query['status.level'] = { $gt: level }
    }
    if (health && Array.isArray(health)) {
        query['status.health'] = { $in: health }
    }

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

    const query = {};

    if (role !== process.env.ROLE_OWNER) query.ownerId = new mongoose.Types.ObjectId(ownerId)

    if (health && health !== "all") {
        query["status.health"] = health
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

    if (binsBatch.every(bin => bin.level && bin.status)) {
        return res.status(400).json({ message: "Cant create Bins with level or status!" });
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

export async function updateBinLocation(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user
    const { location } = req.body

    const filter = { _id: id }

    if (role !== process.env.ROLE_OWNER) {
        filter.ownerId = ownerId
    }

    if (!location || !Array.isArray(location) || location.length !== 2 || !location.every(n => typeof n === "number")) {
        return res.status(400).json({
            message: "Location is mandatory and must be an array of 2 numbers [lng, lat]."
        });
    }

    try {
        const updatedBin = await binModel.findOneAndUpdate(filter, { $set: { "location.coordinates": location } }, { new: true, runValidators: true })

        if (!updatedBin) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ updatedBin })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}
export async function updateBinHealth(req, res) {
    const { id } = req.params
    const { id: ownerId, role } = req.user
    const { health } = req.body

    const filter = { _id: id }

    if (role !== process.env.ROLE_OWNER) {
        filter.ownerId = ownerId
    }

    if (!health || typeof health !== 'string' || !["good", "warning", "critical"].includes(health.toLowerCase())) {
        return res.status(400).json({
            message: "health is mandatory and must be one of 'good', 'warning', 'critical'."
        });
    }

    try {
        const updatedBin = await binModel.findOneAndUpdate(filter, { $set: { "status.health": health } }, { new: true, runValidators: true })

        if (!updatedBin) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ updatedBin })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function deleteBin(req, res) {
    const { id } = req.params;
    const { id: ownerId, role } = req.user

    const query = { _id: id }
    if (role !== process.env.ROLE_OWNER) {
        query.ownerId = ownerId
    }

    try {
        const deleted = await binModel.findOneAndDelete(query)

        if (!deleted) {
            return res.status(404).json({ message: "Bin not found or not owned by you." });
        }
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}
export async function deleteBinsBatch(req, res) {
    const { id: ownerId, role } = req.user
    const binIds = req.binIds

    const query = {}
    if (role !== process.env.ROLE_OWNER) {
        query.ownerId = ownerId
    }

    query._id = { $in: binIds }

    try {
        const results = await binModel.deleteMany(query)
        if (results.deletedCount === 0) return res.status(404).json({ message: "No bins found or not owned by you." });

        res.status(200).json({ deletedCount: results.deletedCount });
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}


