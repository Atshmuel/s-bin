import mongoose from "mongoose";

export const templateSchema = new mongoose.Schema({
    templateId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    textTemplate: { type: String, required: true },
    htmlTemplate: { type: String, required: true },
});