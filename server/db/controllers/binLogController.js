import mongoose from 'mongoose';
import { appendFilter } from '../../utils/helpers.js';
import { binLogModel } from '../models/models.js'
import { verifyBinOwner } from '../service/sharedService.js';


export async function getBinLog(req, res) {
    const { withBin } = req.query
    const { logId } = req.params;
    const { org: ownerId, role } = req.user

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
    const { org: ownerId, role } = req.user

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
    const { org: ownerId, role } = req.user
    const page = Number(req.query.page) || 0;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchRaw = req.query.search;
    const search = (searchRaw !== undefined && searchRaw !== "") ? Number(searchRaw) : NaN;

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
                'bin.ownerId': new mongoose.Types.ObjectId(ownerId),
            },
        });
    }

    if (!isNaN(search)) {
        pipeline.push({
            $match: {
                'newLevel': search,
            },
        });
    }

    pipeline.push({
        $project: {
            bin: 0
        },
    });

    try {
        const facetedPipeline = [
            ...pipeline,
            {
                $facet: {
                    total: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];

        const results = await binLogModel.aggregate(facetedPipeline);
        const total = results[0]?.total[0]?.total || 0;
        const logs = results[0]?.data || [];

        res.status(201).json({ logs, total })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
