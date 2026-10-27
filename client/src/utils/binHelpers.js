import { DEFAULT_THRESHOLDS, WEIGHT_REFERENCE_KG } from "./constants"


// The marker colors for a device's state, from good to critical.
export const STATUS_COLORS = Object.freeze({
    good: "oklch(0.723 0.219 149.579)",
    warning: "oklch(0.769 0.188 70.08)",
    critical: "oklch(0.577 0.245 27.325)",
})


// How full a bin is: whichever of its volume (fill level) and its weight
// (relative to WEIGHT_REFERENCE_KG) is closer to full, since running out of
// either means it needs emptying. Without a working scale it is the fill
// level. Each part is a percentage, 0-100.
export function getFullness(status) {
    const level = Math.min(100, Math.max(0, status?.level ?? 0))
    if (typeof status?.weight !== 'number') {
        return { combined: level, level, weightPercent: null }
    }
    const weightPercent = Math.min(100, Math.max(0, (status.weight / WEIGHT_REFERENCE_KG) * 100))
    return { combined: Math.round(Math.max(level, weightPercent)), level, weightPercent }
}

// "good", "warning" or "critical" for a battery or a fullness, against an
// organization's cut-offs (see useThresholds).
export function batteryState(battery, thresholds = DEFAULT_THRESHOLDS) {
    return battery > thresholds.batteryWarning ? "good" : battery > thresholds.batteryCritical ? "warning" : "critical"
}
export function fullnessState(fullness, thresholds = DEFAULT_THRESHOLDS) {
    return fullness >= thresholds.fullnessCritical ? "critical" : fullness >= thresholds.fullnessWarning ? "warning" : "good"
}

// A marker's color: `levelOrStatus` is a number (0-100) or a status
// `{ level, weight, battery }`, judged by the device's organization's
// cut-offs (`thresholds`).
export function getColor(levelOrStatus, type = 'fill', thresholds = DEFAULT_THRESHOLDS) {
    if (type === 'battery') {
        const level = typeof levelOrStatus === 'object' ? (levelOrStatus.battery ?? 0) : (levelOrStatus ?? 0)
        return STATUS_COLORS[batteryState(level, thresholds)]
    }
    if (type === 'fill') {
        // A status object also counts its weight (see getFullness).
        const level = typeof levelOrStatus === 'object' ? getFullness(levelOrStatus).combined : (levelOrStatus ?? 0)
        return STATUS_COLORS[fullnessState(level, thresholds)]
    }
}

// A mesh gateway has no fill sensor, so it is never shown with a fill level.
export function isGateway(bin) {
    return bin?.kind === 'gateway'
}

export function getVariant(health) {
    switch (health) {
        case "good": return "active"
        case "info": return "active"
        case "warning": return "pending"
        case "critical": return "suspended"
        default: return "outline"
    }
}
