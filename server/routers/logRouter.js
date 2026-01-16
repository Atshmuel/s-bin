
import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { validateParamExist } from "../middlewares/validationMiddleware.js";
import { getAllLogs, getBinLog, getBinLogs } from '../db/controllers/binLogController.js'
export const logRouter = Router();
logRouter.use(authToken) //only admin can access log routes

logRouter.get('/', getAllLogs) //get all logs data
logRouter.get('/all/:binId', validateParamExist('binId'), getBinLogs) //get all bin logs by bin id
logRouter.get('/:logId', validateParamExist('logId'), getBinLog) //get specific bin log id




