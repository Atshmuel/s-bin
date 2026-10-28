import mongoose from "mongoose";
import { DAY_MS, DIAGNOSTICS_RETENTION_DAYS } from "../../utils/constants.js";

// A report's diagnostics (see utils/diagnostics.js), apart from its log so
// they can go sooner: kept DIAGNOSTICS_RETENTION_DAYS. The bin keeps its latest.
export const deviceDiagnosticSchema = new mongoose.Schema({
    binId: { type: mongoose.Schema.Types.ObjectId, ref: "Bin", required: true },
    logId: { type: mongoose.Schema.Types.ObjectId, ref: "BinLog", required: true },
    // When the reading was taken, as its log.
    createdAt: { type: Date, required: true },
    diagnostics: { type: mongoose.Schema.Types.Mixed, required: true },
}, { versionKey: false });

deviceDiagnosticSchema.index({ binId: 1, createdAt: -1 });
deviceDiagnosticSchema.index({ createdAt: 1 }, { expireAfterSeconds: DIAGNOSTICS_RETENTION_DAYS * DAY_MS / 1000 });
