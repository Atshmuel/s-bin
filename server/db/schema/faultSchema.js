import mongoose from "mongoose";
import { FAULT_CODES } from "../../utils/faults.js";

// One fault of a reading or a bin's status (see utils/faults.js). Stored only
// where there is one: `default: undefined` keeps an empty list out of the logs.
export const faultSchema = new mongoose.Schema({
    code: { type: String, enum: FAULT_CODES, required: true },
    cycles: Number,
    mm: Number,
    // instructions_expired: the commands the device did not pick up.
    types: { type: [String], default: undefined },
}, { _id: false });
