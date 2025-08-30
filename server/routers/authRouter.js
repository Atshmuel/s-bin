import { Router } from "express";
import { authToken } from "../middlewares/authMiddleware.js";

export const authRouter = Router();

authRouter.get('/me', authToken, async (req, res) => {
    return res.status(200).json({ user: req.user })
})



