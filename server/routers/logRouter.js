
import { Router } from "express";
import { authBinWithRoleFallback, authRole, authToken } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist } from "../middlewares/validationMiddleware.js";
import { createLog, getAllLogs, getBinLog, getBinLogs } from '../db/controllers/binLogController.js'
export const logRouter = Router();


logRouter.get('/', authToken, (req, res, next) => { authRole([process.env.ROLE_OWNER])(req, res, next) }, getAllLogs) //get all logs data
logRouter.get('/all/:binId', authToken, validateParamExist('binId'), getBinLogs) //get all bin logs by bin id
logRouter.get('/:binId/:logId', authToken, validateParamExist('binId'), validateParamExist('logId'), getBinLog) //get specific bin log id

logRouter.post('/:binId', validateParamExist('binId'), (req, res, next) => {
    authBinWithRoleFallback([process.env.ROLE_OWNER])(req, res, next)
}, validateBodyFields(['newLevel', 'health', 'severity', 'type', 'source'], ['message']), createLog) //log bin status using his id



