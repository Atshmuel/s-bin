import { appendFilter } from '../../utils/helpers.js';
import { binLogModel } from '../models/models.js'
import { verifyBinOwner } from '../service/sharedService.js';


export async function getBinLog(req, res) {
    const { withBin } = req.query
    const { logId } = req.params;
    const { id: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, true, '_id', logId)

    try {
        let logQuery = binLogModel.findOne(query, { __v: 0, updatedAt: 0 });
        if (withBin) {
            logQuery = logQuery.populate('bin')
        }
        const log = await logQuery;

        if (!log) return res.status(404).json({ message: "Bin not found." });

        const isBinOwner = role === process.env.ROLE_OWNER ?? await verifyBinOwner(binId, ownerId)

        if (!isBinOwner)
            return res.status(403).json({ message: 'This bin is not owned by you' })

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

    const isBinOwner = role === process.env.ROLE_OWNER ?? await verifyBinOwner(binId, ownerId)

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
    const { id, role } = req.user

    let filter = {}
    filter = appendFilter(filter, role !== process.env.ROLE_OWNER, 'ownerId', id)


    try {
        const logs = await binLogModel.find(filter, { __v: 0, updatedAt: 0, binId: 0 });
        res.status(201).json({ logs })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
