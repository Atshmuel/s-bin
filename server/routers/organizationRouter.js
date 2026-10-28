import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { createOrganization, getOrganizations, removeOrganization, regenerateRegistrationCode, updateCostSettings, updateFleetSettings, updateThresholdSettings, updateMapSettings, updateOrganization } from "../db/controllers/organizationController.js";
import { validateBodyFields, validateParamExist } from '../middlewares/validationMiddleware.js'
import { COST_SETTINGS, ROLES, THRESHOLD_SETTINGS } from "../utils/constants.js";

export const organizationRouter = Router();
organizationRouter.use(authToken)
const ownersOnly = (req, res, next) => authRole([ROLES.OWNER])(req, res, next)
const ownersAndAdmins = (req, res, next) => authRole([ROLES.OWNER, ROLES.ADMIN])(req, res, next)

// Owners manage the organizations.
organizationRouter.get('/', ownersOnly, getOrganizations);
organizationRouter.post('/', ownersOnly, validateBodyFields(['name']), createOrganization);
organizationRouter.put('/:id', ownersOnly, validateParamExist(), validateBodyFields(['name']), updateOrganization);
organizationRouter.delete('/:id', ownersOnly, validateParamExist(), removeOrganization);
// Trucks and depot: owners for any organization, admins for their own (checked in the controller).
organizationRouter.patch('/:id/fleet', ownersAndAdmins, validateParamExist(), validateBodyFields([], ['fleet', 'depot', 'routePlanningHour']), updateFleetSettings);
// The map: owners for any organization, admins for their own (checked in the controller).
organizationRouter.patch('/:id/map', ownersAndAdmins, validateParamExist(), validateBodyFields(['clusterUntilZoom']), updateMapSettings);
// Costs: owners for any organization, admins for their own (checked in the controller).
organizationRouter.patch('/:id/costs', ownersAndAdmins, validateParamExist(), validateBodyFields([], Object.keys(COST_SETTINGS)), updateCostSettings);
// Fullness and battery cut-offs: owners for any organization, admins for their own (checked in the controller).
organizationRouter.patch('/:id/thresholds', ownersAndAdmins, validateParamExist(), validateBodyFields([], Object.keys(THRESHOLD_SETTINGS)), updateThresholdSettings);
// A new device registration code: owners for any organization, admins for their own (checked in the controller).
organizationRouter.post('/:id/registration-code', ownersAndAdmins, validateParamExist(), regenerateRegistrationCode);
