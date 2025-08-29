import jwt from 'jsonwebtoken';

export function genToken({ data, expiresIn }) {
    return jwt.sign(data, process.env.JWT_HASHED_TOKEN, expiresIn)
}


