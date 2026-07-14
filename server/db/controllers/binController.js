import mongoose from 'mongoose'
import { binModel } from '../models/models.js'
import { appendFilter } from '../../utils/helpers.js'
import { deleteLogsForBins, updateMaintenance } from '../service/sharedService.js'
import { removeBinConfig } from '../../mqtt/mqttHandlers.js';


export async function getBin(req, res) {
    const { id } = req.params;
    const { org: ownerId, role } = req.user
    const { withLogs } = req.query

    let query = {}
    query = appendFilter(query, true, '_id', new mongoose.Types.ObjectId(id))
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))

    const pipeline = [
        { $match: query },
        { $project: { macAddress: 0 } }
    ]
    if (withLogs) {
        pipeline.push({
            $lookup: {
                from: 'binlogs',
                localField: '_id',
                foreignField: 'binId',
                as: 'logs'
            },
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
    const { org: ownerId, role } = req.user
    const { withLogs, page, limit, search } = req.query

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))

    if (search) {
        query.binName = { $regex: search, $options: 'i' };
    }
    const pipeline = [
        { $match: query },
        { $project: { macAddress: 0 } }

    ]
    if (withLogs) {
        pipeline.push({
            $lookup: {
                from: 'binlogs',
                localField: '_id',
                foreignField: 'binId',
                as: 'logs'
            },
        })
    }

    try {

        const facetedPipeline = [
            ...pipeline,
            {
                $facet: {
                    total: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limitNum }]
                }
            }
        ];

        const results = await binModel.aggregate(facetedPipeline);
        const binsData = results[0].data || [];
        const total = results[0].total[0]?.total || 0;

        res.status(200).json({ binsData: binsData || [], total: total })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getBinsByStatus(req, res) {
    const { org: ownerId, role } = req.user
    const { level, health } = req.body

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
    query = appendFilter(query, level && typeof level === 'number', 'status.level', { $gt: level })
    query = appendFilter(query, health && Array.isArray(health), 'status.health', { $in: health })

    try {
        const binsData = await binModel.find(query).select('-macAddress')
        res.status(200).json({ binsData: binsData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getBinsInUserRadius(req, res) {
    const { org: ownerId, role } = req.user
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
                    },
                },
                { $project: { macAddress: 0 } }
            ]
        )

        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getRouteBins(req, res) {
    const { org: ownerId, role } = req.user
    const { coordinates, radius, type, limit, byFoot } = req.body
    if (!coordinates || !Array.isArray(coordinates) || !coordinates.every(el => typeof el === "number")) return res.status(400).json({ message: 'Coordinates is mandatory! (schema: coordinates:{[lat,lng]})' })

    if (!radius || typeof radius !== "number") return res.status(400).json({ message: 'Radius is mandatory!' })

    const parseBooleanParam = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalizedValue = value.trim().toLowerCase();
            if (normalizedValue === 'true') return true;
            if (normalizedValue === 'false') return false;
        }
        return false;
    };

    const useWalkingRoute = parseBooleanParam(byFoot);

    let query = {};
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
    query = appendFilter(query, type === 'maintenance', 'status.health', { $in: ['critical'] })
    query = appendFilter(query, type === 'collection', 'status.level', { $gte: 70 })


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
                    },
                },
                { $limit: limit || 100 },
                { $project: { _id: 1, location: 1, status: 1 } }
            ]
        )

        if (binsData.length === 0)
            return res.status(200).json({ route: [], message: "No bins found in the specified radius matching the criteria" });

        let jobs = binsData.map((bin, i) => {
            return {
                id: i,
                location: [bin.location.coordinates[1], bin.location.coordinates[0]],
                service: type === 'maintenance' ? 1800 : 120, //assuming 30 mins for maintenance and 2 mins for collection per bin, can be adjusted based on real data in the future
                description: bin._id.toString()
            }
        });

        const routeRequestBody = {
            jobs,
            vehicles: [
                {
                    id: 1,
                    profile: useWalkingRoute ? 'foot-walking' : type === 'collection' ? 'driving-hgv' : 'driving-car',
                    start: [coordinates[1], coordinates[0]],
                }],
            options: {
                g: true
            }
        }

        const response = await fetch(`${process.env.ROUTE_OPTIMIZATION_API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.ORS_KEY
            },
            body: JSON.stringify(routeRequestBody)
        })

        const responseData = await response.json();

        if (!response.ok) {
            console.error("ORS API Error:", responseData);
            return res.status(400).json({
                message: "Failed to optimize route",
                details: responseData
            });
        }

        res.status(200).json({ route: responseData.routes[0], binsData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function updateBinName(req, res) {
    const { id } = req.params
    const { org: ownerId, role } = req.user
    const { name } = req.body

    let filter = {}
    filter = appendFilter(filter, true, '_id', id)
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))

    try {
        const updatedBin = await binModel.findOneAndUpdate(filter, { $set: { binName: name } }, { new: true, runValidators: true }).select('-macAddress')

        if (!updatedBin) return res.status(404).json({ message: "Bin not found or not owned by you." });

        res.status(200).json({ bin: updatedBin })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function updateBinMaintenance(req, res) {
    const { id } = req.params
    const { id: technicianId } = req.user
    const { notes } = req.body
    try {
        const success = await updateMaintenance(id, notes, technicianId)
        if (!success) {
            return res.status(404).json({ message: 'Bin not found' });
        }
        return res.json({ message: 'Service recorded' });

    } catch (error) {
        console.error(error);
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
    const { org: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
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

    const { org: ownerId, role } = req.user
    const binIds = req.binIds

    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'ownerId', new mongoose.Types.ObjectId(ownerId))
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

export function removeBinConfigViaMAC(req, res) {
    const { macId } = req.params;

    try {
        removeBinConfig(macId);
        return res.status(200).json({ message: 'Bin configuration removed successfully' });
    } catch (error) {
        console.error("Failed to remove bin configuration:", error);
        return res.status(500).json({ message: "Failed to remove bin configuration", error: error.message });
    }

}