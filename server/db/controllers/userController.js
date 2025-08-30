import { userModel } from '../models/models.js'
import { hashPassword, comparePasswords, generateToken } from '../../utils/helpers.js'

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

export async function getUser(req, res) {
    const { id } = req.params
    try {
        const userData = await userModel.findById(id)
        if (!userData) return res.status(404).json({ message: "User not found." });
        res.status(200).json({ userData })
    } catch (error) {
        res.status(500).json({ message: error?.message || error })
    }
}

export async function getAllUsers(req, res) {
    try {
        const users = await userModel.find({})
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