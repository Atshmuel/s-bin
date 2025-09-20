import mongoose from "mongoose";
import { userSchema } from '../schema/userSchema.js'
import { binLogSchema } from '../schema/binLogSchema.js'
import { binSchema } from '../schema/binSchema.js'
import { templateSchema } from "../schema/templatesSchema.js";
import { userSettingsSchema } from "../schema/userSettingsSchema.js";

export const binModel = mongoose.model("Bin", binSchema);
export const binLogModel = mongoose.model("BinLog", binLogSchema);
export const userModel = mongoose.model("User", userSchema);
export const userSettingModel = mongoose.model("UserSettings", userSettingsSchema);
export const templateModel = mongoose.model("Template", templateSchema);
