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
import { apiLimiter } from './middlewares/rateLimiters.js';

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
// One proxy hop (nginx). Required for req.ip to be the real client address,
// which the rate limiters key on. `false` made every request look like it came
// from the nginx container.
app.set("trust proxy", 1);
app.use("/api", apiLimiter);
app.use("/api/bins", binRouter);
app.use("/api/logs", logRouter);
app.use("/api/users", userRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/auth", authRouter);
app.use("/api/templates", templateRouter)
app.use("/api/overviews", overViewRouter);

// Unknown route -> JSON, not Express's default HTML page.
app.use((req, res) => {
    res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
});

// Terminal error handler. Express 5 forwards rejected async handlers here, so
// this is what stops an unhandled throw from returning an HTML stack trace.
// The 4-argument signature is required for Express to treat it as an error
// handler, so `next` must stay even though it is only used for the
// headers-already-sent case.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err?.status || err?.statusCode || 500;
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);

    res.status(status).json({
        message: status >= 500
            ? 'Internal server error'
            : (err?.message || 'Request failed'),
    });
});

const main = async () => {
    try {
        initMqtt();
        await mongoose.connect(`${DB_URL}`);
        // await import("./db/cron/generateBinLogs.js");
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
