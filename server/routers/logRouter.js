
import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { validateParamExist } from "../middlewares/validationMiddleware.js";
import { getAllLogs, getBinLog, getBinLogs } from '../db/controllers/binLogController.js'
export const logRouter = Router();


logRouter.get('/', authToken, (req, res, next) => { authRole([process.env.ROLE_OWNER])(req, res, next) }, getAllLogs) //get all logs data
logRouter.get('/all/:binId', authToken, validateParamExist('binId'), getBinLogs) //get all bin logs by bin id
logRouter.get('/:logId', authToken, validateParamExist('logId'), getBinLog) //get specific bin log id




