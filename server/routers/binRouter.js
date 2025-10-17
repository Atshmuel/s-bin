import { Router } from "express";
import { authToken, authRole } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist, validateRequestBodyBinIds } from "../middlewares/validationMiddleware.js";
import { createBin, createBinsBatch, deleteBin, getAllUserBins, getBin, updateBinLocation, getBinsInUserRadius, getBinsByStatus, deleteBinsBatch, updateBinHealth, updateBinLevel, updateBinMaintenance, updateBinDeviceKey } from "../db/controllers/binController.js";

export const binRouter = Router();
binRouter.use(authToken) //demends jwt for all requests

//getters
binRouter.get('/all', getAllUserBins) //all user bins in db
binRouter.post('/status', validateBodyFields(['level', 'health']), getBinsByStatus) //get bin
binRouter.get('/:id', validateParamExist(), getBin) //get bin
binRouter.post('/radius/:id', validateParamExist(), validateBodyFields(['coordinates', 'radius'], ['health']), getBinsInUserRadius) //get bin


//posts
binRouter.post('/', validateBodyFields(['binName', 'location']), createBin) //post new bin
binRouter.post('/batch', createBinsBatch) //post array of bins

//updates
binRouter.patch('/location/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), validateBodyFields(['location']), updateBinLocation) //update bin location by id

binRouter.patch('/health/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), validateBodyFields(['health']), updateBinHealth) //update bin health by id

binRouter.patch('/level/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), validateBodyFields(['level']), updateBinLevel) //update bin level by id

binRouter.patch('/key/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER])(req, res, next)
}, validateParamExist(), updateBinDeviceKey) //update bin secret key (deviceKey) by id

binRouter.patch('/maintenance/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN, ROLE_TECHNICIAN])(req, res, next) //update bin maintenance by id
}, validateParamExist(), validateBodyFields(['notes', 'technicianId']), updateBinMaintenance)

//deletes
binRouter.delete('/', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateRequestBodyBinIds, deleteBinsBatch) //delete bins batch by id
binRouter.delete('/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), deleteBin) //delete bin by id







