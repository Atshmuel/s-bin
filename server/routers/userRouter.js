import { Router } from "express";
import { authRole, authToken, resetToken } from '../middlewares/authMiddleware.js'
import { createUser, getAllUsers, getUser, loginUser, logoutUser, deleteUser, forgotPassword, verifyRecoveryCode, updateUserForgotenPassword, verifyNewUser, updateUserNameOrEmail, updateUserPassword, updateUserRole, updateUserStatus, deleteAccount, createUserAsAdmin } from "../db/controllers/userController.js";
import { validateBodyFields, validateParamExist } from "../middlewares/validationMiddleware.js";
import { getSettingsByUserId, updateUserSettings } from "../db/controllers/userSettingsController.js";
export const userRouter = Router();
export const userSettingsRouter = Router({ mergeParams: true });
userRouter.use('/:id/settings', authToken, validateParamExist('id'), userSettingsRouter);


//REGISTER
userRouter.post('/register', validateBodyFields(['email', 'password', 'name']), createUser)
userRouter.get('/register/verify/:token', validateParamExist('token', false), verifyNewUser)

//LOGIN AND LOGOUT
userRouter.post('/login', validateBodyFields(['email', 'password']), loginUser)
userRouter.post('/logout', authToken, logoutUser)

//FORGET
userRouter.post('/forgot', validateBodyFields(['email']), forgotPassword)
userRouter.post('/verify-recovery-code', validateBodyFields(['code', 'email']), verifyRecoveryCode)
userRouter.post('/reset', resetToken, validateBodyFields(['password']), updateUserForgotenPassword)



//Routes only for auth users

userRouter.get('/all', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, getAllUsers)
userRouter.get('/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), getUser)

userRouter.patch('/info/:id', authToken, validateBodyFields([], ['name', 'email']), validateParamExist(), updateUserNameOrEmail) //update email&name

userRouter.patch('/password/:id', authToken, validateBodyFields(['oldPassword', 'newPassword']), validateParamExist(), updateUserPassword) //update the password


userRouter.patch('/status/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateBodyFields(['status']), validateParamExist(), updateUserStatus)

//update role (owner only)
userRouter.patch('/role/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER])(req, res, next)
}, validateBodyFields(['role']), validateParamExist(), updateUserRole)

userRouter.delete('/user/:id', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateParamExist(), deleteUser)

userRouter.delete('/account', authToken, deleteAccount)

//user settings
userSettingsRouter.get('/', getSettingsByUserId)
userSettingsRouter.patch('/', validateBodyFields([], ['isDark', 'notifications', 'alertLevel', 'timezone', 'appLanguage']), updateUserSettings)


userRouter.post('/admin/register', authToken, (req, res, next) => {
    authRole([process.env.ROLE_OWNER, process.env.ROLE_ADMIN])(req, res, next)
}, validateBodyFields(['email', 'password', 'name', 'role', 'status']), createUserAsAdmin)
