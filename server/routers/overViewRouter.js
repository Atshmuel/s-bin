import { Router } from "express";
import { authToken } from "../middlewares/authMiddleware.js";
import { getOverview, getBinsStatusOV, getAIOverview, getLogTypes } from "../db/service/sharedService.js";
import { getOverviewSection } from "../db/controllers/analyticsController.js";

export const overViewRouter = Router();
overViewRouter.use(authToken);

overViewRouter.get("/", getOverview);

overViewRouter.get("/binstatus", getBinsStatusOV)

overViewRouter.get("/ai-ov", getAIOverview);
overViewRouter.get('/logtype', getLogTypes)
// The analytics page's sections, one request each (?range=7|30|90&tz=<IANA zone>).
overViewRouter.get('/:section', getOverviewSection)
