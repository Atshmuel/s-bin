import { Router } from "express";
import { getAllBins, getAlmostFullBins, getAvgFillLevel, getRequiringMaintenance, getAllCriticalBins, getRequiringAttentionBins, getRecentBinLogs } from "../db/service/sharedService.js";
export const overViewRouter = Router();

overViewRouter.get("/all", getAllBins, getAlmostFullBins, getAvgFillLevel, getRequiringMaintenance, getAllCriticalBins, getRequiringAttentionBins, getRecentBinLogs);