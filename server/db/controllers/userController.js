import { userModel } from '../models/models.js'
import { hashPassword, comparePasswords, generateToken, appendFilter, generateOTP } from '../../utils/helpers.js'
import { sendEmail } from '../../utils/mailService.js'
import { forgotHtml, forgotText } from '../../utils/templates.js'
import { emailSchema, passwordSchema } from '../../utils/inputValidations.js'

export async function createUser(req, res) {
    const { email, password, name } = req.body

    if (!email || !password || !name) return res.status(400).json({ message: 'Email, Password and Name are mandatory !' })
    try {

        const passwordHash = await hashPassword(password)
        if (!passwordHash) return res.status(500).json({ message: "Failed to hash the password, couldn't create the user." })

        const newUser = await userModel.create({ email, passwordHash, name })
        if (!newUser) return res.status(500).json({ message: "Failed to  create the user." })

        res.status(201).json({ name: newUser.name });
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function loginUser(req, res) {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and Password are mandatory !' })

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Unauthorized' })

        const { role, _id, name, passwordHash: dbPassword } = user
        const isSamePassword = await comparePasswords(password, dbPassword)
        if (!isSamePassword) return res.status(401).json({ message: 'Unauthorized' })

        const accessToken = generateToken({ id: _id, role, name }, '3d');
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        })

        res.status(200).json({ message: "Login successful" })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function logoutUser(req, res) {
    res.cookie('accessToken', '', {
        httpOnly: true,
        maxAge: 0,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    })
    res.status(200).json({ message: "Logged out successful" })

}

export async function forgotPassword(req, res) {
    const { email } = req.body
    try {
        const { error } = emailSchema.validate(email ?? '')
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

        const user = await userModel.findOneAndUpdate({ email }, update, { new: true });
        if (!user) throw new Error(`Could not find email ${email}, Please verify you email`);
        console.log(user);

        let localHtml = forgotHtml.replaceAll('{{otp}}', otp).replaceAll('{{expiryMinutes}}', expiryMinutes).replaceAll('{{supportEmail}}', process.env.EMAIL_SUPPORT_USER)
        let localText = forgotText.replaceAll('{{otp}}', otp).replaceAll('{{expiryMinutes}}', expiryMinutes).replaceAll('{{supportEmail}}', process.env.EMAIL_SUPPORT_USER);
        await sendEmail(`S-bin No Replay ${process.env.EMAIL_NO_REPLAY_USER}`, email, "Test mailer", localText, localHtml)
        res.status(200).json({ message: 'Email sent successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Failed to send the email.' })
    }
}

export async function VerifyRecoveryCode(req, res) {
    const { code, email } = req.body
    try {
        if (!code) return res.status(400).json({ message: 'Code is mandatory' })
        const { error } = emailSchema.validate(email ?? '')
        if (error) throw new Error(error.message);

        const user = await userModel.findOne({ email })
        if (!user) return res.status(400).json({ message: `Could not find email ${email}, Please verify you email` })
        console.log(user.recoveryCode?.otp, code);

        if (user.recoveryCode?.otp !== code) return res.status(400).json({ message: 'Wrong OTP was provided' })

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
    const { email, reset } = req.reset
    const { error } = passwordSchema.validate(password ?? '')
    if (error) return res.status(400).json({ message: error.message });
    try {


        const passwordHash = await hashPassword(password)
        if (!passwordHash) return res.status(500).json({ message: "Failed to hash the password, couldn't create the user." })

        const update = {
            $set: { passwordHash },
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
    const isUserOwner = role !== process.env.ROLE_OWNER
    query = appendFilter(query, isUserOwner, 'role', { $ne: process.env.ROLE_OWNER })

    try {
        const users = await userModel.find(query, { passwordHash: 0, __v: 0 })
        res.status(200).json({ users: users || [] })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    const { id: currentUserId } = req.user
    try {
        const result = await userModel.deleteOne({
            $and: [
                { _id: id },
                { _id: { $ne: currentUserId } },
                { role: { $ne: "owner" } }
            ]
        })
        if (result.deletedCount === 0) {
            return res.status(403).json({ message: "User not found or you cannot delete yourself" });
        }
        res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }

}