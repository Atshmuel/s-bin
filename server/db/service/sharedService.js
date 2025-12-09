import mongoose from 'mongoose'
import { binModel, binLogModel, templateModel, userModel, userSettingModel } from '../models/models.js'


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
        console.error('Error in innerGetTemplateByTemplateId: ', error);
        return null
    }
}

//overview
export async function getAllBins(req, res, next) {
    try {
        const bins = await binModel.countDocuments();
        req.totalBins = bins;
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error in getAllBinsShared' });
    }
}

export async function getAlmostFullBins(req, res, next) {
    try {
        const almostFullBins = await binModel.find({ "status.level": { $gte: 80 } });
        req.totalAlmostFullBins = almostFullBins.length;
        req.almostFullBins = almostFullBins;
        next()
    } catch (error) {
        return res.status(500).json({ message: 'Error in getAlmostFullBins' });
    }
}

export async function getAvgFillLevel(req, res, next) {
    try {
        const avg = await binModel.aggregate([{
            $group: { _id: null, avgLevel: { $avg: "$status.level" } }
        }])

        req.average = avg[0].avgLevel > 0 ? avg[0].avgLevel : 0
        next()
    } catch (error) {
        res.status(500).json({ message: 'Error in getAvgFillLevel' })
    }

}

export async function getRequiringMaintenance(req, res, next) {
    try {
        const RequirinBins = await binModel.find({
            "maintenance.nextServiceAt": { $lt: new Date() }
        })
        req.totalRequiringMaintenance = RequirinBins.length;
        req.requirinMaintenanceBins = RequirinBins;
        next()
    } catch (error) {
        res.status(500).json({ message: 'Error in getRequiringMaintenance' })
    }
}
export async function getAllCriticalBins(req, res, next) {
    try {
        const almostFullBins = req.almostFullBins
        const requirinBins = req.requirinMaintenanceBins

        req.criticalBins = [...almostFullBins, ...requirinBins];
        next()
    } catch (error) {
        return res.status(500).json({ message: 'Error in getAllCriticalBins' })
    }

}
export async function getRequiringAttentionBins(req, res, next) {
    try {
        const criticalBins = req.criticalBins
        const requiringAttentionBins = await binModel.find({
            $or: [
                { "status.battery": { $lte: 40 } },
                { "status.health": { $in: ["warning", "critical"] } }
            ]
        }).limit(50);
        req.requiringAttentionBins = [...criticalBins, ...requiringAttentionBins];
        next()
    } catch (error) {
        return res.status(500).json({ message: 'Error in getRequiringAttentionBins' })

    }
}

export async function getRecentBinLogs(req, res, next) {
    try {
        const recentLogs = await binLogModel.find({
            createdAt: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        }).sort({ createdAt: -1 }).limit(50);

        req.recentBinLogs = recentLogs;
        next()
    } catch (error) {
        return res.status(400).json({ message: 'Error in getRecentBinLogs' })
    }
}
