import { Router } from "express";
import { authToken } from "../middlewares/authMiddleware.js";
import { getBinsStatusOV, getLogTypes } from "../db/service/sharedService.js";
import { getAIOverview } from "../db/controllers/aiOverviewController.js";
import { getOverviewSection } from "../db/controllers/analyticsController.js";

export const overViewRouter = Router();
overViewRouter.use(authToken);

overViewRouter.get("/binstatus", getBinsStatusOV)

overViewRouter.get("/ai-ov", getAIOverview);
overViewRouter.get('/logtype', getLogTypes)
// The dashboard's and the analytics page's sections, one request each
// (?range=7|30|90&tz=<IANA zone> where they take a range).
overViewRouter.get('/:section', getOverviewSection)
