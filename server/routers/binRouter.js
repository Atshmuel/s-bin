import { Router } from "express";
import { authToken, authRole } from "../middlewares/authMiddleware.js";
import { validateBodyFields, validateParamExist, validateRequestBodyBinIds } from "../middlewares/validationMiddleware.js";
import { deleteBin, getAllUserBins, getBin, getBinsInUserRadius, getBinsByStatus, deleteBinsBatch, updateBinMaintenance } from "../db/controllers/binController.js";

export const binRouter = Router();

//protected routes for admin panel requests 
binRouter.use(authToken) //demends jwt for all requests

//getters
binRouter.get('/all', getAllUserBins) //all user bins in db
binRouter.post('/status', validateBodyFields(['level', 'health']), getBinsByStatus) //get bin
binRouter.get('/:id', validateParamExist(), getBin) //get bin
binRouter.post('/radius', validateBodyFields(['coordinates', 'radius'], ['health', 'minLevel', 'maxLevel']), getBinsInUserRadius) //get bins

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







