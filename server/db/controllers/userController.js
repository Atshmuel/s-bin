import { userModel, userSettingModel } from '../models/models.js'
import { hashPassword, comparePasswords, generateToken, appendFilter, generateOTP, generateVerificationLink } from '../../utils/helpers.js'
import { sendEmail } from '../../utils/mailService.js'
import { emailSchema, passwordSchema } from '../../utils/inputValidations.js'
import { deleteUserRefs, innerGetTemplateByTemplateId } from '../service/sharedService.js'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'


export async function createUser(req, res) {
    const { email, password, name } = req.body
    const session = await mongoose.startSession();
    let newUser;
    let settings;

    try {
        const { error: emailError } = emailSchema.validate(email ?? '')
        if (emailError) throw new Error(emailError.message);

        const { error } = passwordSchema.validate(password ?? '')
        if (error) return res.status(400).json({ message: error.message });

        const passwordHash = await hashPassword(password)
        if (!passwordHash) return res.status(500).json({ message: "Failed to hash the password, couldn't create the user." })
        await session.withTransaction(async () => {
            newUser = new userModel({
                email: email.toLowerCase(),
                passwordHash,
                name,
                accountVerification: {
                    token: uuidv4(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            await newUser.save({ session });

            settings = new userSettingModel({ userId: newUser._id });
            await settings.save({ session });

            newUser.settingsId = settings._id;
            await newUser.save({ session });


            const url = generateVerificationLink(newUser.accountVerification.token);
            if (!url) throw new Error('Failed to generate verifiction link')

            const { textTemplate, htmlTemplate, email: senderEmail, subject } = await innerGetTemplateByTemplateId("accountVerification")

            const localText = textTemplate.replaceAll('{{verificationLink}}', url)
            const localHtml = htmlTemplate.replaceAll('{{verificationLink}}', url)

            await sendEmail(senderEmail, email, subject, localText, localHtml)
        })

        res.status(201).json({
            user: {
                name: newUser.name,
                email: newUser.email,
                status: newUser.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    } finally {
        session.endSession();
    }
}

export async function verifyNewUser(req, res) {
    const { token } = req.params

    try {
        const user = await userModel.findOneAndUpdate({
            'accountVerification.token': token,
            'accountVerification.expiresAt': { $gt: new Date() }
            , status: 'pending'
        }, { $set: { status: 'active' }, $unset: { accountVerification: "" } }, { new: true }).select('name email')

        if (!user) {
            return res.status(400).json({ message: 'User not found or not in pending status' });
        }
        res.status(200).json({ message: 'User verified successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || error });
    }
}

export async function loginUser(req, res) {

    const { email, password } = req.body

    const { error: emailError } = emailSchema.validate(email ?? '')
    if (emailError) throw new Error(emailError.message);
    const { error } = passwordSchema.validate(password ?? '')
    if (error) return res.status(400).json({ message: error.message });

    const lowerCaseEmail = email.toLowerCase()

    try {
        const user = await userModel.findOne({ email: lowerCaseEmail }).populate({ path: 'settingsId', select: 'isDark' });

        if (!user) return res.status(401).json({ message: 'Please verify your email or password' })

        const { role, _id, passwordHash: dbPassword, settings, tokenVersion } = user
        const isSamePassword = await comparePasswords(password, dbPassword)
        if (!isSamePassword) return res.status(401).json({ message: 'Unauthorized' })

        const accessToken = generateToken({ id: _id, role, tokenVersion }, '3d');
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        })

        res.cookie('isDark', settings?.isDark || 'light', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        res.status(200).json({ message: "Login successful" })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function logoutUser(req, res) {
    const { id } = req.user
    try {
        await userModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } });

        res.cookie('accessToken', '', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
        res.status(200).json({ message: "Logged out successful" })
    } catch (err) {
        console.error('Failed to logout:', err);
        res.status(500).json({ message: 'Logout failed' });
    }

}

export async function forgotPassword(req, res) {
    const { email: userEmail } = req.body
    try {
        const { error } = emailSchema.validate(userEmail ?? '')
        if (error) throw new Error(error.message);

        const { otp, expiresAt, expiryMinutes } = await generateOTP()
        const update = {
            $set: {
                recoveryCode: {
                    otp,
                    expiresAt
                }
            }
        };
        const lowerCaseEmail = userEmail.toLowerCase()
        const user = await userModel.findOneAndUpdate({ email: lowerCaseEmail }, update, { new: true });
        if (!user) throw new Error(`Could not find email ${userEmail}, Please verify you email`);

        const { textTemplate, htmlTemplate, email: senderEmail, subject } = await innerGetTemplateByTemplateId('forgotPassword')

        let localHtml = htmlTemplate.replaceAll('{{otp}}', otp).replaceAll('{{expiryMinutes}}', expiryMinutes).replaceAll('{{supportEmail}}', process.env.EMAIL_SUPPORT_USER)
        let localText = textTemplate.replaceAll('{{otp}}', otp).replaceAll('{{expiryMinutes}}', expiryMinutes).replaceAll('{{supportEmail}}', process.env.EMAIL_SUPPORT_USER);
        await sendEmail(senderEmail, userEmail, subject, localText, localHtml)
        res.status(200).json({ message: 'Email sent successfully' })
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to send the email.' })
    }
}

export async function verifyRecoveryCode(req, res) {
    const { code, email } = req.body
    try {
        if (!code) return res.status(400).json({ message: 'Code is mandatory' })
        const { error } = emailSchema.validate(email ?? '')
        if (error) throw new Error(error.message);

        const lowerCaseEmail = email.toLowerCase()
        const user = await userModel.findOne({ email: lowerCaseEmail })

        if (!user) return res.status(400).json({ message: `Could not find email ${email}, Please verify you email` })

        if (user.recoveryCode?.otp !== code) return res.status(400).json({ message: 'Wrong OTP code provided' })

        const resetPasswordToken = generateToken({ email, reset: true }, '5m')
        res.cookie('resetToken', resetPasswordToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 5 * 1000,
            sameSite: 'strict',
        })

        res.status(200).json({ message: 'Valid OTP' })
    } catch (error) {
        res.status(500).json({ message: 'Faild to verify the OTP' })
    }
}

export async function updateUserForgotenPassword(req, res) {
    const { password } = req.body;
    const { email } = req.reset
    const { error } = passwordSchema.validate(password ?? '')
    if (error) return res.status(400).json({ message: error.message });
    try {


        const passwordHash = await hashPassword(password)
        if (!passwordHash) return res.status(500).json({ message: "Failed to hash the password, couldn't create the user." })

        const update = {
            $set: { passwordHash },
            $inc: { tokenVersion: 1 },
            $unset: { recoveryCode: "" }
        }
        const updated = await userModel.findOneAndUpdate({ email }, update)
        if (!update) throw new Error("Faild update the user's password");

        res.cookie('resetToken', '', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
        res.status(200).json({ message: "Updated successfully" })

    } catch (error) {
        res.status(500).json({ message: error.message })

    }
}

export async function updateUserNameOrEmail(req, res) {
    const { id } = req.params //id of the user that we want to update
    const { name, email } = req.body
    const { id: userId, role } = req.user

    const filter = {
        _id: role === process.env.ROLE_OWNER ? id : userId
    };

    const update = {};
    if (name != null) update.name = name;
    if (email != null) update.email = email;

    try {
        const updatedUser = await userModel.findOneAndUpdate(filter, { $set: update }, { new: true }).select('-passwordHash -__v -accountVerification -role -email')
        if (!updatedUser)
            return res.status(403).json({ message: "Not allowed to update this user" });

        return res.status(200).json({ updatedUser });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function updateUserPassword(req, res) {
    const { id } = req.params //id of the user that we want to update
    const { id: userId, role } = req.user
    const { oldPassword, newPassword } = req.body

    const { error: oError } = passwordSchema.validate(oldPassword ?? '')
    if (oError) return res.status(400).json({ message: oError.message });
    const { error: nError } = passwordSchema.validate(newPassword ?? '')
    if (nError) return res.status(400).json({ message: nError.message });

    const filter = {
        _id: role === process.env.ROLE_OWNER ? id : userId
    };

    try {
        const user = await userModel.findOne(filter)
        if (!user) return res.status(401).json({ message: 'User not found' })

        if (role !== process.env.ROLE_OWNER) {
            const isSamePassword = await comparePasswords(oldPassword, user.passwordHash)
            if (!isSamePassword) return res.status(403).json({ message: 'Invalid password' })
        }

        const passwordHash = await hashPassword(newPassword)
        if (!passwordHash) return res.status(500).json({ message: "Failed to hash the password, therefore could not update the password" })

        const updatedUser = await userModel.findByIdAndUpdate(user._id, {
            $set: { passwordHash },
            $inc: { tokenVersion: 1 },
        }, { new: true, select: 'email name' })
        if (!updatedUser) return res.status(401).json({ message: 'Failed to update the password' })

        const accessToken = generateToken({ id: updatedUser._id, role: user.role, tokenVersion: updatedUser.tokenVersion }, '3d');
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        });

        return res.status(200).json({ updatedUser });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function updateUserRole(req, res) {
    const { id } = req.params //id of the user that we want to update
    const { role } = req.body
    const { id: userId, role: currentUserRole } = req.user

    if (![process.env.ROLE_OPERATOR, process.env.ROLE_TECHNICIAN, process.env.ROLE_ADMIN, process.env.ROLE_OWNER].includes(role))
        return res.status(400).json({ message: 'This role is not allow' })
    if (id === userId) return res.status(400).json({ message: 'User not allow to update his role' })
    if (currentUserRole === role) return res.status(400).json({ message: 'User not allow to assign a role equal to his' })

    try {
        const updatedUser = await userModel.findOneAndUpdate({
            $and: [
                { _id: id }, { role: { $ne: process.env.ROLE_OWNER } }
            ]
        }, { $set: { role }, $inc: { tokenVersion: 1 } }, { new: true }).select('-passwordHash -__v -accountVerification')
        if (!updatedUser)
            return res.status(403).json({ message: "Not allowed to update this user" });

        return res.status(200).json({ updatedUser });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function updateUserStatus(req, res) {
    const { id } = req.params //id of the user that we want to update
    const { status } = req.body
    const { id: userId, role } = req.user

    let query = { _id: id }

    if (id === userId && role !== process.env.ROLE_OWNER)
        return res.status(400).json({ message: 'User not allow to update his status' })

    if (!["active", "inactive", "suspended"].includes(status))
        return res.status(400).json({ message: 'This status is not allow' })

    if (role !== process.env.ROLE_OWNER) {
        query.role = { $nin: [process.env.ROLE_OWNER, process.env.ROLE_ADMIN] }
    }


    try {
        const updatedUser = await userModel.findOneAndUpdate(
            query, { $set: { status } }, { new: true }).select('-passwordHash -__v -accountVerification')
        if (!updatedUser)
            return res.status(403).json({ message: "Not allowed to update this user" });

        return res.status(200).json({ updatedUser });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

export async function getUser(req, res) {
    const { id } = req.params
    const { role } = req.user

    let query = { _id: id }

    const isUserOwner = role !== process.env.ROLE_OWNER
    query = appendFilter(query, isUserOwner, 'role', { $ne: process.env.ROLE_OWNER })

    try {
        const userData = await userModel.findOne(query, { passwordHash: 0, __v: 0 })

        if (!userData) return res.status(404).json({ message: "User not found." });
        res.status(200).json({ userData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}
export async function getAllUsers(req, res) {
    const { role } = req.user
    let query = {}
    query = appendFilter(query, role !== process.env.ROLE_OWNER, 'role', { $ne: process.env.ROLE_OWNER })

    try {
        const users = await userModel.find(query, { passwordHash: 0, __v: 0 })
        res.status(200).json({ users: users || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    const { id: currentUserId, role: currentUserRole } = req.user
    try {

        if (id === currentUserId) {
            return res.status(403).json({ message: "You cannot delete your own account using from this method" });
        }

        const userToDelete = await userModel.findById(id);
        if (currentUserRole !== process.env.ROLE_OWNER && (!userToDelete || userToDelete.role !== process.env.ROLE_OPERATOR)) {
            return res.status(403).json({ message: "User not found or cannot delete an owner / admin" });
        }
        await deleteUserRefs(id);

        res.status(200).json({ message: "User and their content deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function deleteAccount(req, res, next) {
    const { id } = req.user
    try {
        const user = await deleteUserRefs(id)
        if (!user) throw new Error('Failed to delete the user')

        res.cookie('accessToken', '', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
        res.cookie('theme', '', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
        res.status(200).json({ message: "Account and related content deleted successfully" });
    } catch (error) {
        const status = error.message === "User not found" ? 404 : 500
        res.status(status).json({ message: error?.message || error })
    }
}