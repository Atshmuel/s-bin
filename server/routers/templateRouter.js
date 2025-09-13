import { Router } from "express";
import { innerCreateTemplate } from "../db/controllers/templateController.js";
import { authRole, authToken } from "../middlewares/authMiddleware.js";
import { validateBodyFields } from "../middlewares/validationMiddleware.js";


export const templateRouter = Router();
templateRouter.use(authToken)

templateRouter.post('/', validateBodyFields(['templateId', 'email', 'subject', 'htmlTemplate', 'textTemplate']), (req, res, next) => {
    authRole([process.env.ROLE_OWNER])(req, res, next)
}, async (req, res) => {
    try {
        const template = await innerCreateTemplate(req.body)
        if (!template) throw new Error('Failed to create the template')
        res.status(200).json({ template })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

})