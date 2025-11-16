import { userSettingModel } from '../models/models.js'



export async function getSettingsByUserId(req, res) {
    const { id } = req.params
    const { id: userId, role } = req.user

    const filter = {
        userId: role === process.env.ROLE_OWNER ? id : userId
    };

    try {
        const settings = await userSettingModel.findOne(filter)
        if (!settings) {
            return res.status(404).json({ message: 'User Settings not found' })
        }
        return res.status(200).json({ settings })
    } catch (error) {
        console.error(`Error getting settings for userId ${userId}:`, error);
        return res.status(500).json({ message: error?.errors || 'something went wrong trying to get user settings' })
    }
}

export async function updateUserSettings(req, res) {
    const { id } = req.params
    const { id: userId, role } = req.user
    const updates = req.body

    const filter = {
        _id: role === process.env.ROLE_OWNER ? id : userId
    };

    try {
        const settings = await userSettingModel.findOneAndUpdate(filter, updates, { new: true, runValidators: true }
        )
        if (!settings) {
            return res.status(404).json({ message: 'User Settings not found' })
        }
        return res.status(200).json({ settings })
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(field => ({
                field,
                message: error.errors[field].message
            }));
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }
        console.error(`Error updating settings for userId ${userId}:`, error);
        return res.status(500).json({ message: error?.errors || 'something went wrong trying to update user settings' })
    }
}







