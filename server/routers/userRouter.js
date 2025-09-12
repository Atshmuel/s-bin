import { Router } from "express";
import { authRole, authToken, resetToken } from '../middlewares/authMiddleware.js'
import { createUser, getAllUsers, getUser, loginUser, logoutUser, deleteUser, forgotPassword, VerifyRecoveryCode, updateUserForgotenPassword } from "../db/controllers/userController.js";
import { validateObjectId } from "../middlewares/validationMiddleware.js";

export const userRouter = Router();

userRouter.get('/all', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, getAllUsers)
userRouter.get('/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), getUser)

userRouter.post('/register', createUser)
userRouter.post('/login', loginUser)
userRouter.post('/logout', logoutUser)
userRouter.post('/forgot', forgotPassword)
userRouter.post('/verify-recovery-code', VerifyRecoveryCode)
userRouter.post('/reset', resetToken, updateUserForgotenPassword)

userRouter.post('/forgot', forgotPassword)


userRouter.patch('/:id', authToken, validateObjectId(), async (req, res) => { })

userRouter.delete('/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateObjectId(), deleteUser)


