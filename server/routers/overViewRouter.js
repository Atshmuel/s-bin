import { Router } from "express";
import { authToken } from "../middlewares/authMiddleware.js";
import { getOverview, getBinsStatusOV, getAIOverview, getLogTypes } from "../db/service/sharedService.js";

export const overViewRouter = Router();
overViewRouter.use(authToken);

overViewRouter.get("/", getOverview);

overViewRouter.get("/binstatus", getBinsStatusOV)

overViewRouter.get("/ai-ov", getAIOverview);
overViewRouter.get('/logtype', getLogTypes)
