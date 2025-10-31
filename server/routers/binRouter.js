import { Router } from "express";
import { authToken, authRole, authDevice } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist, validateRequestBodyBinIds } from "../middlewares/validationMiddleware.js";
import { createBin, deleteBin, getAllUserBins, getBin, updateBinLocation, getBinsInUserRadius, getBinsByStatus, deleteBinsBatch, updateBinHealth, updateBinLevel, updateBinMaintenance } from "../db/controllers/binController.js";

export const binRouter = Router();

//posts
binRouter.post('/', validateBodyFields(['mac', 'userId']), createBin) //post new bin no auth needed

//*** protected routes for device requests ***
//updates
binRouter.patch('/location/:id', authDevice, validateBodyFields(['location']), updateBinLocation) //update bin location by id

binRouter.patch('/health/:id', authDevice, validateBodyFields(['health']), updateBinHealth) //update bin health by id

binRouter.patch('/level/:id', authDevice, validateBodyFields(['level']), updateBinLevel) //update bin level by id

// binRouter.patch('/key/:id', (req, res, next) => {
//     authRole([process.env.ROLE_OWNER])(req, res, next)
// }, validateParamExist(), updateBinDeviceKey) //update bin secret key (deviceKey) by id


//protected routes for admin panel requests 
binRouter.use(authToken) //demends jwt for all requests

//getters
binRouter.get('/all', getAllUserBins) //all user bins in db
binRouter.post('/status', validateBodyFields(['level', 'health']), getBinsByStatus) //get bin
binRouter.get('/:id', validateParamExist(), getBin) //get bin
binRouter.post('/radius/:id', validateParamExist(), validateBodyFields(['coordinates', 'radius'], ['health', 'minLevel', 'maxLevel']), getBinsInUserRadius) //get bin

//updates
binRouter.patch('/maintenance/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN, process.env.ROLE_TECHNICIAN])(req, res, next) //update bin maintenance by id
}, validateParamExist(), validateBodyFields(['notes']), updateBinMaintenance)


//deletes
binRouter.delete('/', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateRequestBodyBinIds, deleteBinsBatch) //delete bins batch by id
binRouter.delete('/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), deleteBin) //delete bin by id







