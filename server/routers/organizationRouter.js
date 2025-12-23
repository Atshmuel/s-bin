import { Router } from "express";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { createOrganization, getOrganizations } from "../db/controllers/organizationController.js";
import { validateBodyFields } from '../middlewares/validationMiddleware.js'

export const organizationRouter = Router();
organizationRouter.use(authToken, (req, res, next) => { authRole([process.env.ROLE_OWNER])(req, res, next) })


organizationRouter.get('/', getOrganizations); //id in params will be handled in controller
organizationRouter.post('/', validateBodyFields(['name']), createOrganization);
