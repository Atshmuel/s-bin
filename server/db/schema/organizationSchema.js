import mongoose from "mongoose";

export const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

