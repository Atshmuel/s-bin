
import { Router } from "express";
import { authRole } from "../middlewares/authMiddleware.js";

export const logRouter = Router();

logRouter.get('/', async (req, res) => { }) //get all logs data
logRouter.get('/:binId', async (req, res) => { }) //get all bin logs by bin id
logRouter.get('/:binId/:logId', async (req, res) => { }) //get specific bin log id

logRouter.post('/:binId', async (req, res) => { }) //log bin status using his id

logRouter.delete('/:logId', authRole([process.env.ROLE_OWNER]), async (req, res) => { }) //delete bin log by log id
logRouter.delete('/:binId', authRole([process.env.ROLE_OWNER]), async (req, res) => { }) //delete all bin logs by bin id