import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('.env') });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";


import { userRouter } from './routers/userRouter.js'
import { binRouter } from './routers/binRouter.js'
import { authRouter } from './routers/authRouter.js'
import { logRouter } from './routers/logRouter.js'
import { overViewRouter } from './routers/overViewRouter.js';
import { templateRouter } from './routers/templateRouter.js';
import { organizationRouter } from './routers/organizationRouter.js';
import { setEmailServiceCredentials } from './utils/mailService.js';
import { initMqtt } from './mqtt/mqttClient.js';

const { SERVER_PORT, DB_URL, CLIENT_BASE_URL, CLIENT_BASE_URL_PROD, CLIENT_BASE_URL_3 } = process.env

const app = express();
app.use(
    cors({
        origin: [
            CLIENT_BASE_URL,
            CLIENT_BASE_URL_PROD,
            CLIENT_BASE_URL_3,
            // "http://localhost:5173"
        ],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", false);
app.use("/api/bins", binRouter);
app.use("/api/logs", logRouter);
app.use("/api/users", userRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/auth", authRouter);
app.use("/api/templates", templateRouter)
app.use("/api/overviews", overViewRouter);

const main = async () => {
    try {
        initMqtt();
        await mongoose.connect(`${DB_URL}`);
        await import("./db/cron/generateBinLogs.js");
        await import("./db/cron/cleanupOTP.js");
        await import("./db/cron/cleanupActivationToken.js");
        setEmailServiceCredentials()
        await import("./db/cron/notifyCriticalBins.js");
        app.listen(SERVER_PORT, () => {
            console.log(mongoose.connection.readyState === 1 && `Connected to DB..`);
            console.log(`Listening on port ${SERVER_PORT}`);
        });
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};
main();
