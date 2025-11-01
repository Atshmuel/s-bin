import mongoose from 'mongoose'
import { binModel, templateModel, userModel, userSettingModel } from '../models/models.js'
import { binLogModel } from '../models/models.js'


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

