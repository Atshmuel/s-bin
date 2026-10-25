import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { selectOrganization, validateParamExist } from "../middlewares/validationMiddleware.js";
import { createRoute, getRoute, listDrivers, listRoutes, updateRoute } from "../db/controllers/routeController.js";
import { ROLES } from "../utils/constants.js";

export const routeRouter = Router();
routeRouter.use(authToken)
const ownersAndAdmins = (req, res, next) => authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)

// Reading: owners (every organization, ?org= for one), admins (their own's),
// drivers (theirs); checked in the controller. Planning and changes: owners
// and admins.
routeRouter.get('/', selectOrganization, listRoutes);
routeRouter.get('/drivers', ownersAndAdmins, selectOrganization, listDrivers);
routeRouter.get('/:id', validateParamExist(), getRoute);
routeRouter.post('/', ownersAndAdmins, createRoute);
routeRouter.patch('/:id', ownersAndAdmins, validateParamExist(), updateRoute);
