import { Router } from "express";
import { authCookie } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.get('/role', authCookie, async (req, res) => {
    return res.status(200).json({ user: req.user })
})

