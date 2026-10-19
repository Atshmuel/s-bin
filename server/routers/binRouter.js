import { Router } from "express";
import { authToken, authRole } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist, validateRequestBodyBinIds } from "../middlewares/validationMiddleware.js";
import { deleteBin, getAllUserBins, getBin, getBinsInUserRadius, deleteBinsBatch, updateBinMaintenance, removeBinConfigViaMAC, updateBinName, getRouteBins } from "../db/controllers/binController.js";
import { cancelDeviceInstruction, enqueueDeviceInstruction, listDeviceInstructions } from "../db/controllers/deviceInstructionController.js";
import { getMeshSettings, updateMeshSettings } from "../db/controllers/organizationController.js";
import { getBinAnalytics } from "../db/controllers/analyticsController.js";
import { ROLES } from "../utils/constants.js";

export const binRouter = Router();

//protected routes for admin panel requests 
binRouter.use(authToken) //demends jwt for all requests

//getters
binRouter.get('/all', getAllUserBins) //all user bins in db
// Mesh settings: owners for any organization, admins for their own (checked in the controller).
binRouter.get('/mesh-settings', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, getMeshSettings)
binRouter.patch('/mesh-settings/:orgId', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, updateMeshSettings)
binRouter.get('/:id', validateParamExist(), getBin) //get bin
binRouter.get('/:id/analytics/:section', getBinAnalytics) //one bin page analytics section (?range=7|30|90)
binRouter.post('/radius', validateBodyFields(['coordinates', 'radius'], ['health', 'minLevel', 'maxLevel']), getBinsInUserRadius) //get bins
binRouter.post('/route', validateBodyFields(['coordinates', 'radius', 'type'], ['byFoot']), getRouteBins) //get bins in radius for maintenance or collection route
//updates
binRouter.patch('/maintenance/:id', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN, ROLES.TECHNICIAN])(req, res, next) //update bin maintenance by id
}, validateParamExist(), validateBodyFields(['notes']), updateBinMaintenance)
binRouter.patch('/name/:id', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next) //update bin name by id
}, validateParamExist(), validateBodyFields(['name']), updateBinName)

// Device instructions: owners for any bin, admins for their organization's bins (checked in the controller).
binRouter.post('/:id/instructions', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, enqueueDeviceInstruction)
binRouter.get('/:id/instructions', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, listDeviceInstructions)
binRouter.delete('/:id/instructions/:instructionId', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, cancelDeviceInstruction)


//deletes
binRouter.delete('/', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, validateRequestBodyBinIds, deleteBinsBatch) //delete bins batch by id
binRouter.delete('/:id', (req, res, next) => {
    authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
}, validateParamExist(), deleteBin) //delete bin by id
//delete bin by mac and remove config
binRouter.delete('/mac/:macId', (req, res, next) => {
    authRole([ROLES.OWNER])(req, res, next)
}, validateParamExist('macId', false), removeBinConfigViaMAC)


