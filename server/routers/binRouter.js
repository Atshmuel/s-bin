import { Router } from "express";
import { authToken, authRole } from "../middlewares/authMiddleware.js";
import { validateObjectId } from "../middlewares/validationMiddleware.js";
import { createBin, createBinsBatch, deleteBin, getOwnerBin, getOwnerAllBins, getAllUserBins, getBin, updateBin, getBinsInUserRadius } from "../db/controllers/binController.js";

export const binRouter = Router();
binRouter.use(authToken) //demends jwt for all requests

//owner router for bins
const ownerBinRouter = Router();
ownerBinRouter.use((req, res, next) => {
    authRole([process.env.ROLE_OWNER])(req, res, next)
});
ownerBinRouter.get('/all', getOwnerAllBins);
ownerBinRouter.get('/:id', validateObjectId(), getOwnerBin);

binRouter.use('/owner', ownerBinRouter);
//end of owner router for bins


binRouter.get('/all', getAllUserBins) //all user bins in db
binRouter.get('/:id', validateObjectId(), getBin) //get bin
binRouter.post('/radius/:id', validateObjectId(), getBinsInUserRadius) //get bin

binRouter.post('/', createBin) //post new bin
binRouter.post('/batch', createBinsBatch) //post array of bins

binRouter.patch('/:id', validateObjectId(), updateBin) //update bin by id


binRouter.delete('/:id', (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), deleteBin) //delete bin by id



