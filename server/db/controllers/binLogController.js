import { appendFilter } from '../../utils/helpers.js';
import { binLogModel } from '../models/models.js'
import { getBinShared, verifyBinOwner } from '../service/sharedService.js';


export async function getBinLog(req, res) {
    const { logId, binId } = req.params;
    const { id: ownerId } = req.user

    let query = {}
    query = appendFilter(query, true, '_id', logId)
    query = appendFilter(query, true, 'binId', binId)

    const isBinOwner = await verifyBinOwner(binId, ownerId)

    if (!isBinOwner)
        return res.status(403).json({ message: 'This bin is not owned by you' })
    try {
        const log = await binLogModel.findOne(query, { __v: 0, updatedAt: 0, binId: 0 });
        if (!log) return res.status(404).json({ message: "Bin not found." });

        res.status(201).json({ log })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}


export async function getBinLogs(req, res) {
    const { binId } = req.params;
    const { id: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, true, 'binId', binId)

    const isBinOwner = await verifyBinOwner(binId, ownerId)

    if (!isBinOwner)
        return res.status(403).json({ message: 'This bin is not owned by you' })

    try {
        const logs = await binLogModel.find(query, { __v: 0, updatedAt: 0, binId: 0 });
        res.status(201).json({ logs },)
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}


export async function getAllLogs(req, res) {
    try {
        const log = await binLogModel.find({}, { __v: 0, updatedAt: 0, binId: 0 });
        res.status(201).json({ log })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
