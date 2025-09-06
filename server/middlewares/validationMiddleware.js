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


export function validateRequestBodyIds(req, res, next) {
    const { binIds } = req.body
    if (!binIds || !Array.isArray(binIds)) {
        return res.status(400).json({ message: `binIds are mandatory and must be an array!` })
    }
    if (binIds.length === 0) {
        return res.status(400).json({ message: "binIds array cannot be empty" });
    }
    if (new Set(binIds).size !== binIds.length) {
        return res.status(400).json({ message: "Duplicate ids are not allowed" });
    }

    const cleanedIds = binIds.map((id) => id?.toString().trim());
    if (!cleanedIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ message: `Invalid id found in in the array` });
    }
    req.binIds = cleanedIds

    next();
}