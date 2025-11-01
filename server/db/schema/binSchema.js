import mongoose from "mongoose";
import { add } from 'date-fns'
export const binSchema = new mongoose.Schema({
    binName: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },
    deviceKey: {
        type: String,
        required: true,
        unique: true,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: arr => arr.length === 2,
                message: "Coordinates must be [lat, lng]"
            }
        },
    },
    status: {
        health: {
            type: String,
            enum: ["good", "warning", "critical"],
            default: "good"
        },
        level: { type: Number, default: 0, required: true },
        battery: { type: Number, default: 0, required: true },
        updatedAt: { type: Date, default: Date.now }
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    maintenance: {
        lastServiceAt: { type: Date, default: Date.now },
        nextServiceAt: { type: Date, default: () => add(new Date(), { days: 90 }) },

        notes: String,
        technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    macAddress: {
        type: String,
        unique: true,
        sparse: true,
        default: null,
        match: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/
    },
}, { timestamps: true });


binSchema.methods.recordService = function (notes, technicianId) {
    const now = new Date();
    this.maintenance.lastServiceAt = now;
    this.maintenance.nextServiceAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (notes) this.maintenance.notes = notes;
    if (technicianId) this.maintenance.technicianId = technicianId;
    return this.save();
}

binSchema.index({ ownerId: 1 });
binSchema.index({ macAddress: 1, deviceKey: 1 });
binSchema.index({ location: "2dsphere" });
