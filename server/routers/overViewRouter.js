import { Router } from "express";
import { authToken } from "../middlewares/authMiddleware.js";
import { getAllBins, getAlmostFullBins, getAvgFillLevel, getRequiringMaintenance, getAllCriticalBins, getRequiringAttentionBins, getRecentBinLogs, mapOverviewToResponse } from "../db/service/sharedService.js";

export const overViewRouter = Router();
overViewRouter.use(authToken);

overViewRouter.get("/", getAllBins, getAlmostFullBins, getAvgFillLevel, getRequiringMaintenance, getAllCriticalBins, getRequiringAttentionBins, getRecentBinLogs, mapOverviewToResponse);