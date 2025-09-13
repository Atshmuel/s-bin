import mongoose from 'mongoose'
import { binModel, templateModel, userModel } from '../models/models.js'
import { binLogModel } from '../models/models.js'


export async function pushLogToBin(binId, logId, level) {
    try {
        if (!binId || !logId) throw new Error('missing parameters')
        const log = await binLogModel.findById(logId)
        if (!log) throw new Error('log not found')
        const updateBin = await binModel.findByIdAndUpdate(
            binId,
            { $push: { levelLogs: logId }, $set: { 'status.level': level } },
            { new: true }
        );
        if (!updateBin) throw new Error('bin not found')
    } catch (error) {
        throw error
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

export async function deleteUserBins(userId) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const user = await userModel.findByIdAndDelete(userId, { session });
        if (!user) throw new Error("User not found");

        const bins = await binModel.find({ ownerId: userId }, '_id', { session })
        const binIds = bins.map(b => b._id)

        await binModel.deleteMany({ ownerId: userId }, { session });

        await binLogModel.deleteMany({ binId: { $in: binIds } }, { session })

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


export async function innerGetTemplateByTemplateId(templateId) {
    try {
        if (!templateId || typeof templateId !== 'string')
            throw new Error('templateId must be string')
        const template = await templateModel.findOne({ templateId })
        return template
    } catch (error) {
        console.log(error);
        return null
    }
}