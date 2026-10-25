import mongoose from "mongoose";

// A bin held by an open route. The unique binId is what keeps two routes off
// the same bin, even when both are planned in the same moment: the second
// insert fails. Closing or cancelling a route deletes its reservations;
// `expiresAt` releases any the closing missed.
export const routeReservationSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    binId: { type: mongoose.Schema.Types.ObjectId, ref: "Bin", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    expiresAt: { type: Date, required: true },
});

routeReservationSchema.index({ binId: 1 }, { unique: true });
routeReservationSchema.index({ routeId: 1 });
routeReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
