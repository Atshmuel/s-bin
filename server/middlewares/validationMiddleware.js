import mongoose from "mongoose";

export function validateParamExist(paramName = "id", verifyObjectId = true) {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!id) return res.status(400).json({ message: `${paramName} is mandatory!` })
        if (verifyObjectId) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: `Invalid ${paramName}: '${id}'` });
            }
        }
        next();
    };
}


export function validateRequestBodyBinIds(req, res, next) {
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

export function validateBodyFields(requiredFields = [], optionalFields = []) {
    const allowedFields = [...requiredFields, ...optionalFields];

    return (req, res, next) => {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ message: 'Invalid body request' });
        }

        const keys = Object.keys(req.body);

        if (keys.length === 0) {
            return res.status(400).json({ message: 'Request body cannot be empty' });
        }

        // בדיקה עבור שדות לא חוקיים
        const invalidFields = keys.filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Invalid fields in request: ${invalidFields.join(', ')}`
            });
        }

        // בדיקה עבור שדות מחייבים
        const missingFields = requiredFields.filter(field => !keys.includes(field));
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        next();
    }
}
