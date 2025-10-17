
export function getBinColor(level) {
    return level > 75 ? "red" : level > 50 && level <= 75 ? "orange" : "green"
}
export function getVariant(health) {
    switch (health) {
        case "good": return "active"
        case "warning": return "pending"
        case "critical": return "suspended"
        default: return "outline"
    }
}
