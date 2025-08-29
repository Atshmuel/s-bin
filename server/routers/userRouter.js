import { Router } from "express";
import { authRole } from '../middlewares/auth.js'
export const userRouter = Router();

userRouter.get('/', async (req, res) => { })
userRouter.get('/:id', async (req, res) => { })
userRouter.post('/', async (req, res) => { })
userRouter.patch('/:id', async (req, res) => { })
userRouter.delete('/:id', authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN]), async (req, res) => { })
