
export function getColor(level, type = 'fill') {
    if (type === 'battery') {
        return level > 75 ? "oklch(0.723 0.219 149.579)" : level > 50 && level <= 75 ? "oklch(0.769 0.188 70.08)" : "oklch(0.577 0.245 27.325)"
    }
    if (type === 'fill') {
        return level > 75 ? "oklch(0.577 0.245 27.325)" : level > 50 && level <= 75 ? "oklch(0.769 0.188 70.08)" : "oklch(0.723 0.219 149.579)"
    }
}

export function getVariant(health) {
    switch (health) {
        case "good": return "active"
        case "warning": return "pending"
        case "critical": return "suspended"
        default: return "outline"
    }
}
