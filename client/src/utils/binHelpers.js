
export function getColor(levelOrStatus, type = 'fill') {
    // levelOrStatus can be a numeric level (0-100) or an object `{ level, weight, battery }`
    if (type === 'battery') {
        const level = typeof levelOrStatus === 'object' ? (levelOrStatus.battery ?? 0) : (levelOrStatus ?? 0)
        return level > 75 ? "oklch(0.723 0.219 149.579)" : level > 50 && level <= 75 ? "oklch(0.769 0.188 70.08)" : "oklch(0.577 0.245 27.325)"
    }
    if (type === 'fill') {
        let level = typeof levelOrStatus === 'object' ? (levelOrStatus.level ?? 0) : (levelOrStatus ?? 0)
        // If weight is available, combine it with level to determine fill seriousness.
        // Weight is expected in kilograms. We normalize it against a MAX_WEIGHT (kg).
        const statusObj = typeof levelOrStatus === 'object' ? levelOrStatus : null
        if (statusObj && typeof statusObj.weight === 'number') {
            const MAX_WEIGHT = 250 // kg — heuristic upper bound for normalization
            const weightPercent = Math.min(100, Math.max(0, (statusObj.weight / MAX_WEIGHT) * 100))
            // Combine level and weightPercent — level more important than weight
            const combined = Math.round(level * 0.6 + weightPercent * 0.4)
            level = combined
        }
        return level > 75 ? "oklch(0.577 0.245 27.325)" : level > 50 && level <= 75 ? "oklch(0.769 0.188 70.08)" : "oklch(0.723 0.219 149.579)"
    }
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
