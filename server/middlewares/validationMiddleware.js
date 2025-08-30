import mongoose from "mongoose";

export function validateObjectId(paramName = "id") {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!id) return res.status(400).json({ message: `${paramName} is mandatory!` })

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `Invalid ${paramName}: '${id}'` });
        }
        next();
    };
}
