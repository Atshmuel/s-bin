import mongoose from 'mongoose'
import { binModel, deviceInstructionModel } from '../models/models.js'
import { appendFilter, BINS_ONLY_FILTER, scopeToOrganization } from '../../utils/helpers.js'
import { FULLNESS_EXPRESSION } from '../../utils/analytics.js'
import { DEFAULT_COLLECTION_FULLNESS, DEFAULT_PAGE_SIZE, ROUTE_MAX_BINS, ROUTE_STOP_SECONDS } from '../../utils/constants.js'
import { deleteLogsForBins, getOrgDeviceSettingsShared, updateMaintenance } from '../service/sharedService.js'
import { removeBinConfig } from '../../mqtt/mqttHandlers.js';

export async function getBin(req, res) {
    const { id } = req.params;
    const { withLogs } = req.query

    let query = {}
    query = appendFilter(query, true, '_id', new mongoose.Types.ObjectId(id))
    query = scopeToOrganization(query, req.user)

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

        // The bins whose last report this device relayed. Any device with a SIM
        // can relay for mesh leaves: a gateway, or a bin that is also a gateway.
        const device = binData[0];
        if (device) {
            device.connectedLeaves = await binModel.find(
                { ownerId: device.ownerId, 'status.connection.gatewayId': device._id },
                { binName: 1, 'status.updatedAt': 1, 'status.connection.hops': 1, 'status.connection.rssi': 1 }
            ).lean();
            // When the device next reports, which is when it gets queued instructions.
            const { reportIntervalMinutes, reportStartHour } = await getOrgDeviceSettingsShared(device.ownerId);
            device.reportSchedule = { reportIntervalMinutes, reportStartHour };
            // A leaf links to the gateway its last report came through.
            const gatewayId = device.status?.connection?.gatewayId;
            if (gatewayId) {
                device.gateway = await binModel.findOne(
                    { _id: gatewayId, ownerId: device.ownerId },
                    { binName: 1 }
                ).lean();
            }
        }

        res.status(200).json({ binData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUserBins(req, res) {
    const { withLogs, page, limit, search } = req.query

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || DEFAULT_PAGE_SIZE;
    const skip = (pageNum - 1) * limitNum;

    let query = {}
    query = scopeToOrganization(query, req.user)

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

export async function getBinsInUserRadius(req, res) {
    const { coordinates, radius, health, minLevel, maxLevel } = req.body
    if (!coordinates || !Array.isArray(coordinates) || !coordinates.every(el => typeof el === "number")) return res.status(400).json({ message: 'Coordinates is mandatory! (schema: coordinates:{[lat,lng]})' })

    if (!radius || typeof radius !== "number") return res.status(400).json({ message: 'Radius is mandatory!' })

    let query = {};
    query = scopeToOrganization(query, req.user)
    query = appendFilter(query, health && health !== "all", 'status.health', health)
    // The range is on fullness (level or weight, whichever is higher), the
    // value the markers are colored by.
    const fullnessStages = []
    if (minLevel !== undefined || maxLevel !== undefined) {
        // Gateways have no fullness; without a range filter they stay on the map.
        query = { ...query, ...BINS_ONLY_FILTER }
        fullnessStages.push(
            { $addFields: { fullness: FULLNESS_EXPRESSION } },
            {
                $match: {
                    fullness: {
                        $gte: minLevel !== undefined ? Number(minLevel) : 0,
                        $lte: maxLevel !== undefined ? Number(maxLevel) : 100,
                    },
                },
            },
        )
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
                ...fullnessStages,
                { $project: { macAddress: 0, deviceKey: 0 } }
            ]
        )

        res.status(200).json({ binsData: binsData || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

const HEALTH_FILTERS = ['good', 'warning', 'critical', 'all']

export async function getRouteBins(req, res) {
    const { coordinates, radius, type, limit, byFoot, minLevel, maxLevel, health } = req.body
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

    // The route visits what the map's search finds: a collection the bins in
    // the fullness range (level or weight, whichever is higher), a maintenance
    // visit the devices, gateways included, in the health filter.
    const fullnessRange = [minLevel, maxLevel].map((value, i) =>
        value === undefined ? DEFAULT_COLLECTION_FULLNESS[i] : Number(value))
    if (fullnessRange.some(value => !Number.isFinite(value) || value < 0 || value > 100) ||
        fullnessRange[0] > fullnessRange[1]) {
        return res.status(400).json({ message: 'minLevel and maxLevel must be 0-100, minLevel first.' })
    }
    // Maintenance without a health filter keeps its old meaning: critical devices.
    const healthFilter = health ?? (type === 'maintenance' ? 'critical' : 'all')
    if (!HEALTH_FILTERS.includes(healthFilter)) {
        return res.status(400).json({ message: `health must be one of ${HEALTH_FILTERS.join(', ')}.` })
    }

    let query = {};
    query = scopeToOrganization(query, req.user)
    query = appendFilter(query, healthFilter !== 'all', 'status.health', healthFilter)
    const fullnessStages = []
    if (type === 'collection') {
        // Gateways need maintenance visits but are never collected.
        query = { ...query, ...BINS_ONLY_FILTER }
        fullnessStages.push(
            { $addFields: { fullness: FULLNESS_EXPRESSION } },
            { $match: { fullness: { $gte: fullnessRange[0], $lte: fullnessRange[1] } } },
        )
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
                ...fullnessStages,
                { $limit: limit || ROUTE_MAX_BINS },
                { $project: { _id: 1, location: 1, status: 1 } }
            ]
        )

        if (binsData.length === 0)
            return res.status(200).json({ route: [], message: "No bins found in the specified radius matching the criteria" });

        let jobs = binsData.map((bin, i) => {
            return {
                id: i,
                location: [bin.location.coordinates[1], bin.location.coordinates[0]],
                service: ROUTE_STOP_SECONDS[type] ?? ROUTE_STOP_SECONDS.collection,
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
    const { name } = req.body

    let filter = {}
    filter = appendFilter(filter, true, '_id', id)
    filter = scopeToOrganization(filter, req.user)

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

export async function deleteBin(req, res) {
    const { id } = req.params;
    let query = {}
    query = scopeToOrganization(query, req.user)
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
        await deviceInstructionModel.deleteMany({ binId: deleteBinResult._id }, { session })

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
    const binIds = req.binIds

    let query = {}
    query = scopeToOrganization(query, req.user)
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
        await deviceInstructionModel.deleteMany({ binId: { $in: binsToDeleteIds } }, { session })

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
