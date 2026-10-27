import mongoose from "mongoose";
import { THRESHOLD_MIN_GAP, THRESHOLD_SETTINGS } from "./constants.js";

// Each organization's fullness and battery cut-offs (see THRESHOLD_SETTINGS).

export const DEFAULT_THRESHOLDS = Object.freeze(Object.fromEntries(
    Object.entries(THRESHOLD_SETTINGS).map(([field, [byDefault]]) => [field, byDefault])));

// An organization's cut-offs: its own, the defaults for any it has not set.
export function thresholdsOf(organization) {
    return { ...DEFAULT_THRESHOLDS, ...(organization?.thresholds ?? {}) };
}

// Why a set of cut-offs is not valid, or null: each a whole number in its
// range, and warning on the safe side of critical by THRESHOLD_MIN_GAP.
export function thresholdsProblem(thresholds) {
    for (const [field, [, min, max]] of Object.entries(THRESHOLD_SETTINGS)) {
        const value = thresholds[field];
        if (!Number.isInteger(value) || value < min || value > max) return `${field} must be a whole number from ${min} to ${max}.`;
    }
    if (thresholds.fullnessCritical - thresholds.fullnessWarning < THRESHOLD_MIN_GAP) {
        return `The fullness warning must be at least ${THRESHOLD_MIN_GAP} below critical.`;
    }
    if (thresholds.batteryWarning - thresholds.batteryCritical < THRESHOLD_MIN_GAP) {
        return `The battery warning must be at least ${THRESHOLD_MIN_GAP} above critical.`;
    }
    return null;
}

// "critical", "warning" or "good" for a fullness or a battery (null when unknown).
export function fullnessLevel(fullness, thresholds) {
    if (!Number.isFinite(fullness)) return null;
    return fullness >= thresholds.fullnessCritical ? "critical" : fullness >= thresholds.fullnessWarning ? "warning" : "good";
}
export function batteryLevel(battery, thresholds) {
    if (!Number.isFinite(battery)) return null;
    return battery <= thresholds.batteryCritical ? "critical" : battery <= thresholds.batteryWarning ? "warning" : "good";
}

// The organizations' cut-offs by id; a device of another (or none) gets the defaults.
export function thresholdsFor(byOrganization, ownerId) {
    return byOrganization.get(String(ownerId)) ?? DEFAULT_THRESHOLDS;
}

// A cut-off as a MongoDB expression over a device's organization (`ownerField`):
// each organization's own, the default for any other.
export function thresholdExpression(byOrganization, field, ownerField = "$ownerId") {
    const branches = [...byOrganization].map(([orgId, thresholds]) => ({
        case: { $eq: [ownerField, new mongoose.Types.ObjectId(orgId)] }, then: thresholds[field],
    }));
    return branches.length ? { $switch: { branches, default: DEFAULT_THRESHOLDS[field] } } : DEFAULT_THRESHOLDS[field];
}
