import mongoose from 'mongoose';
import { appendFilter } from '../../utils/helpers.js';
import { binLogModel } from '../models/models.js'
import { verifyBinOwner } from '../service/sharedService.js';


export async function getBinLog(req, res) {
    const { withBin } = req.query
    const { logId } = req.params;
    const { id: ownerId, role } = req.user

    let query = {}
    query = appendFilter(query, true, '_id', new mongoose.Types.ObjectId(logId))

    try {
        let logQuery = binLogModel.findOne(query, { __v: 0, updatedAt: 0 });
        if (withBin) {
            logQuery = logQuery.populate('bin')
        }
        const log = await logQuery;

        if (!log) return res.status(404).json({ message: "Bin not found." });

        let isBinOwner = role === process.env.ROLE_OWNER

        if (withBin && role !== process.env.ROLE_OWNER) {
            isBinOwner = log.bin.ownerId.toString() === ownerId;
        }
        else if (!withBin && role !== process.env.ROLE_OWNER) {
            isBinOwner = await verifyBinOwner(log.binId, ownerId)
        }
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

    const isBinOwner = role !== process.env.ROLE_OWNER ? await verifyBinOwner(binId, ownerId) : true;

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

    const pipeline = [
        {
            $lookup: {
                from: 'bins',
                localField: 'binId',
                foreignField: '_id',
                as: 'bin',
            },
        },
        { $unwind: '$bin' },
    ];

    if (role !== process.env.ROLE_OWNER) {
        pipeline.push({
            $match: {
                'bin.ownerId': new mongoose.Types.ObjectId(id),
            },
        });
    }

    pipeline.push({
        $project: {
            bin: 0
        },
    });

    try {
        const logs = await binLogModel.aggregate(pipeline);
        res.status(201).json({ logs })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
