import Joi from 'joi'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants.js'

export const emailSchema = Joi.string().email({
    tlds: { allow: false }
}).required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address"
})
export const passwordSchema = Joi.string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .required()
    .messages({
        "string.empty": "Password is required",
        "string.min": `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
        "string.max": `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
    })
    .custom((value, helpers) => {
        if (!/[a-z]/.test(value)) {
            return helpers.message("Password must include at least one lowercase letter");
        }
        if (!/[A-Z]/.test(value)) {
            return helpers.message("Password must include at least one uppercase letter");
        }
        if (!/[0-9]/.test(value)) {
            return helpers.message("Password must include at least one number");
        }
        if (!/[!@#$%^&*]/.test(value)) {
            return helpers.message("Password must include at least one special character (!@#$%^&*)");
        }
        return value;
    });
