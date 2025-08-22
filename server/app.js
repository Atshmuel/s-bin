import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../.env') });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import { userRouter } from './routers/userRouter.js'
import { binRouter } from './routers/binRouter.js'

const { SERVER_PORT, DB_URL } = process.env

const app = express();
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", false);
app.use("/api/bins", binRouter);
app.use("/api/users", userRouter);

const main = async () => {
    try {
        await mongoose.connect(`${DB_URL}`);
        app.listen(SERVER_PORT, () => {
            console.log(mongoose.connection.readyState === 1 && `Connected to DB.`);
            console.log(`Listening on port ${SERVER_PORT}`);
        });
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};
main();
