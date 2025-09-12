import { binModel } from '../models/models.js'
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
