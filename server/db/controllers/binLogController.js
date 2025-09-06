import { binLogModel } from '../models/models.js'
import { pushLogToBin } from '../service/sharedService.js';
export async function createLog(req, res) {
    const { binId } = req.params;
    const { level } = req.body
    if (level === undefined || level === null)
        return res.status(400).json({ message: 'Level is mandatory !' })
    try {
        const newLog = await binLogModel.create({ binId, level })
        await pushLogToBin(binId, newLog._id, level)
        res.status(201).json({ log: newLog })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}