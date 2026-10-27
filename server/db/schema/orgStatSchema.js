import mongoose from "mongoose";

// One organization's day (a date in its time zone) in numbers, from its bins'
// reports: the emptyings, how full the bins were before them (a sum and a
// count, so days add up), the kilograms taken away (weighed by a scale, or
// estimated from fullness), and how many bins reported. Kept fresh by
// db/service/statsService.js.
export const orgStatSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    timeZone: { type: String, required: true },
    collections: { type: Number, default: 0 },
    fullnessBeforeSum: { type: Number, default: 0 },
    fullnessBeforeCount: { type: Number, default: 0 },
    weighedKg: { type: Number, default: 0 },
    weighedCollections: { type: Number, default: 0 },
    estimatedKg: { type: Number, default: 0 },
    reportingBins: { type: Number, default: 0 },
    computedAt: { type: Date, required: true },
}, { versionKey: false });

orgStatSchema.index({ orgId: 1, day: 1 }, { unique: true });
