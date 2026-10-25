import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { selectOrganization, validateParamExist } from "../middlewares/validationMiddleware.js";
import {
    createRoute, deleteRoute, finishRoute, getRoute, listDrivers, listRoutes, markStopDone, planDayNow, skipStop, startRoute, undoSkipStop,
    undoStopDone, updateRoute,
} from "../db/controllers/routeController.js";
import { ROLES } from "../utils/constants.js";

export const routeRouter = Router();
routeRouter.use(authToken)
const ownersAndAdmins = (req, res, next) => authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)
const ownersOnly = (req, res, next) => authRole([ROLES.OWNER])(req, res, next)

// Reading: owners (every organization, ?org= for one), admins (their own's),
// drivers (theirs); checked in the controller. Planning and changes: owners
// and admins. Deleting: owners.
routeRouter.get('/', selectOrganization, listRoutes);
routeRouter.get('/drivers', ownersAndAdmins, selectOrganization, listDrivers);
// The nightly plan, now (it runs on its own every night at the organization's planning hour).
routeRouter.post('/plan-day', ownersAndAdmins, selectOrganization, planDayNow);
routeRouter.get('/:id', validateParamExist(), getRoute);
routeRouter.post('/', ownersAndAdmins, createRoute);
routeRouter.patch('/:id', ownersAndAdmins, validateParamExist(), updateRoute);
routeRouter.delete('/:id', ownersOnly, validateParamExist(), deleteRoute);
// Driving: the route's driver, or an admin of its organization (checked in the controller).
routeRouter.post('/:id/start', validateParamExist(), startRoute);
routeRouter.post('/:id/stops/:binId/done', validateParamExist(), validateParamExist('binId'), markStopDone);
routeRouter.delete('/:id/stops/:binId/done', validateParamExist(), validateParamExist('binId'), undoStopDone);
routeRouter.post('/:id/stops/:binId/skip', validateParamExist(), validateParamExist('binId'), skipStop);
routeRouter.delete('/:id/stops/:binId/skip', validateParamExist(), validateParamExist('binId'), undoSkipStop);
routeRouter.post('/:id/finish', validateParamExist(), finishRoute);
