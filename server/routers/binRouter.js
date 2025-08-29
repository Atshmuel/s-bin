import { Router } from "express";
import { authRole } from "../middlewares/auth.js";
import { createBin, createBinsBatch, updateBin } from "../db/controllers/binController.js";
export const binRouter = Router();


binRouter.get('/', async (req, res) => { })
binRouter.get('/:id', async (req, res) => { }) //get bin

binRouter.post('/', createBin) //post new bin
binRouter.post('/batch', createBinsBatch) //post array of bins

binRouter.patch('/:id', updateBin) //update bin by id

binRouter.delete('/:id', authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN]), async (req, res) => { }) //delete bin by id

