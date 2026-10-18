import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { createOrganization, getOrganizations, removeOrganization, updateOrganization } from "../db/controllers/organizationController.js";
import { validateBodyFields, validateParamExist } from '../middlewares/validationMiddleware.js'
import { ROLES } from "../utils/constants.js";

export const organizationRouter = Router(); //owners route - only owners can access
organizationRouter.use(authToken, (req, res, next) => { authRole([ROLES.OWNER])(req, res, next) })


organizationRouter.get('/', getOrganizations);
organizationRouter.post('/', validateBodyFields(['name']), createOrganization);
organizationRouter.put('/:id', validateParamExist(), validateBodyFields(['name']), updateOrganization);
organizationRouter.delete('/:id', validateParamExist(), removeOrganization);