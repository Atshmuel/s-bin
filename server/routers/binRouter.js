import { Router } from "express";
import { authToken, authRole } from "../middlewares/authMiddleware.js";
import { validateObjectId, validateRequestBodyBinIds } from "../middlewares/validationMiddleware.js";
import { createBin, createBinsBatch, deleteBin, getAllUserBins, getBin, updateBinLocation, getBinsInUserRadius, getBinsByStatus, deleteBinsBatch, updateBinHealth } from "../db/controllers/binController.js";

export const binRouter = Router();
binRouter.use(authToken) //demends jwt for all requests

//getters
binRouter.get('/all', getAllUserBins) //all user bins in db
binRouter.post('/status', getBinsByStatus) //get bin
binRouter.get('/:id', validateObjectId(), getBin) //get bin
binRouter.post('/radius/:id', validateObjectId(), getBinsInUserRadius) //get bin


//posts
binRouter.post('/', createBin) //post new bin
binRouter.post('/batch', createBinsBatch) //post array of bins

//updates
binRouter.patch('/location/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), updateBinLocation) //update bin location by id
binRouter.patch('/health/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), updateBinHealth) //update bin health by id

//deletes
binRouter.delete('/', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateRequestBodyBinIds, deleteBinsBatch) //delete bins batch by id
binRouter.delete('/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), deleteBin) //delete bin by id





