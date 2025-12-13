import mongoose from 'mongoose'
import { binModel, binLogModel, templateModel, userModel, userSettingModel } from '../models/models.js'
import { appendFilter, UnionArraysById } from '../../utils/helpers.js'


//Bins
export async function getBinShared(binId) {
    try {
        if (!binId)
            throw new Error('binId is mandatory')
        const bin = await binModel.findById(binId)
        return bin
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function getBinByMacAndKeyShared(macAddress, deviceKey) {
    try {
        if (!macAddress || !deviceKey)
            throw new Error('macAddress and deviceKey are mandatory')
        const bin = await binModel.findOne({ deviceKey, macAddress })
        return bin
    } catch (error) {
        console.error(error)
        return null;
    }
}

export async function verifyBinOwner(binId, ownerId) {
    try {
        if (!binId || !ownerId)
            throw new Error('binId and ownerId are mandatory')
        const exists = await binModel.exists({ _id: binId, ownerId })
        return !!exists
    } catch (error) {
        console.error(error)
        return false
    }
}

//Refs deletion
export async function deleteUserRefs(userId) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const user = await userModel.findByIdAndDelete(userId, { session });
        if (!user) throw new Error("User not found");

        const userSetting = await userSettingModel.findOneAndDelete({ userId }, { session });
        if (!userSetting) throw new Error("User settings not found");

        const bins = await binModel.find({ ownerId: userId }, '_id', { session })
        const binIds = bins.map(b => b._id)
        await binModel.deleteMany({ ownerId: userId }, { session });

        await deleteLogsForBins(binIds, session)

        await session.commitTransaction();
        return user;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
}

export async function deleteLogsForBins(binIds, session) {
    if (!Array.isArray(binIds) || binIds.length === 0) return 0
    const deleteResult = await binLogModel.deleteMany({ binId: { $in: binIds } }, { session })
    return deleteResult.deletedCount;
}

//Users
export async function getUserShared(userId) {
    try {
        if (!userId)
            throw new Error('userId is mandatory')
        const user = await userModel.exists({ _id: userId })
        if (!user) throw new Error('User not found')
        return true
    } catch (error) {
        console.error(error)
        return false;
    }
}

//Emails
export async function innerGetTemplateByTemplateId(templateId) {
    try {
        if (!templateId || typeof templateId !== 'string')
            throw new Error('templateId must be string')
        const template = await templateModel.findOne({ templateId })
        return template
    } catch (error) {
        console.error(error?.message || 'Error in innerGetTemplateByTemplateId: ', error);
        return null
    }
}

//overview
export async function getAllBins(req, res, next) {
    const { id, role } = req.user;
    let filter = {}
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)

    try {
        const bins = await binModel.countDocuments(filter);
        req.totalBins = bins;
        next();
    } catch (error) {
        return res.status(500).json({ message: error?.message || 'Error in getAllBinsShared' });
    }
}

export async function getAlmostFullBins(req, res, next) {
    const { id, role } = req.user;
    let filter = { "status.level": { $gte: 80 } }

    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)

    try {
        const almostFullBins = await binModel.find(filter);
        req.totalAlmostFullBins = almostFullBins.length;
        req.almostFullBins = almostFullBins;
        next()
    } catch (error) {
        return res.status(500).json({ message: error?.message || 'Error in getAlmostFullBins' });
    }
}

export async function getAvgFillLevel(req, res, next) {
    const { id, role } = req.user;
    const aggregation = []

    if (role !== process.env.ROLE_OWNER) {
        aggregation.push({ $match: { ownerId: new mongoose.Types.ObjectId(id) } })
    }
    aggregation.push({ $group: { _id: null, avgLevel: { $avg: "$status.level" } } })
    try {
        const avg = await binModel.aggregate(aggregation)
        if (!avg.length) {
            req.average = 0
            return next()
        }

        req.average = avg[0].avgLevel > 0 ? avg[0].avgLevel : 0
        next()
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Error in getAvgFillLevel' })
    }

}

export async function getRequiringMaintenance(req, res, next) {
    const { id, role } = req.user;

    let filter = {
        "maintenance.nextServiceAt": { $lt: new Date() }
    }

    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)

    try {
        const RequirinBins = await binModel.find(filter)
        req.totalRequiringMaintenance = RequirinBins.length;
        req.requirinMaintenanceBins = RequirinBins;
        next()
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Error in getRequiringMaintenance' })
    }
}
export async function getAllCriticalBins(req, res, next) {
    try {
        const bins = UnionArraysById(req.almostFullBins, req.requirinMaintenanceBins);

        req.criticalBins = bins;
        next()
    } catch (error) {
        return res.status(500).json({ message: error?.message || 'Error in getAllCriticalBins' })
    }

}
export async function getRequiringAttentionBins(req, res, next) {
    const { id, role } = req.user;
    let filter = {
        $or: [
            { "status.battery": { $lte: 40 } },
            { "status.health": { $in: ["warning", "critical"] } }
        ]
    }

    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)

    try {
        const requiringAttentionBins = await binModel.find(filter).limit(50);
        const bins = UnionArraysById(req.criticalBins, requiringAttentionBins);
        req.requiringAttentionBins = bins;
        next()
    } catch (error) {
        return res.status(500).json({ message: error?.message || 'Error in getRequiringAttentionBins' })

    }
}

export async function getRecentBinLogs(req, res, next) {
    const { id, role } = req.user;
    let filter = {
        createdAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    }
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)

    try {
        const recentLogs = await binLogModel.find(filter).sort({ createdAt: -1 }).limit(50);
        req.recentBinLogs = recentLogs;
        next()
    } catch (error) {
        return res.status(400).json({ message: error?.message || 'Error in getRecentBinLogs' })
    }
}


export function mapOverviewToResponse(req, res) {
    const overview = {
        totalBins: req?.totalBins || 0,
        totalAlmostFullBins: req?.totalAlmostFullBins || 0,
        averageFillLevel: req?.average || 0,
        totalRequiringMaintenance: req?.totalRequiringMaintenance || 0,
        criticalBins: req?.criticalBins || [],
        requiringAttentionBins: req?.requiringAttentionBins || [],
        recentBinLogs: req?.recentBinLogs || []
    }
    return res.status(200).json(overview);
}