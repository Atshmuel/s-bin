
import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist } from "../middlewares/validationMiddleware.js";
import { createLog, getAllLogs, getBinLog, getBinLogs } from '../db/controllers/binLogController.js'
export const logRouter = Router();

logRouter.use(authToken) //demends jwt for all requests

logRouter.get('/', (req, res, next) => {
    authRole([process.env.ROLE_OWNER])(req, res, next)
}, getAllLogs) //get all logs data
logRouter.get('/all/:binId', validateParamExist('binId'), getBinLogs) //get all bin logs by bin id
logRouter.get('/:binId/:logId', validateParamExist('binId'), validateParamExist('logId'), getBinLog) //get specific bin log id

logRouter.post('/:binId', validateParamExist('binId'), validateBodyFields(['level'], []), createLog) //log bin status using his id



// logRouter.delete('/:logId', (req, res, next) => {
//     authRole([process.env.ROLE_OWNER])(req, res, next)
// }, async (req, res) => { }) //delete bin log by log id
// logRouter.delete('/:binId', (req, res, next) => {
//     authRole([process.env.ROLE_OWNER])(req, res, next)
// }, async (req, res) => { }) //delete all bin logs by bin id

