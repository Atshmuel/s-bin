import { RadioTower, Trash2 } from "lucide-react"
import { GatewayBinIcon } from "@/components/bins/DeviceRoleIcon"
import { isGateway } from "./binHelpers"

// What a device is in the mesh, from what the server already knows:
// - "gateway": a pole gateway, no fill sensor (kind "gateway");
// - "meshBin": a bin without a SIM, reporting through a gateway;
// - "gatewayBin": a bin with a SIM, reporting itself and serving nearby
//   leaves; a device that has not reported yet registered over cellular.
export function getDeviceRole(bin) {
    if (isGateway(bin)) return "gateway"
    if (bin?.status?.connection?.via === "mesh") return "meshBin"
    return "gatewayBin"
}

// The icon component for a role, for places that take a component (map markers).
export function getDeviceRoleIcon(role) {
    if (role === "gateway") return RadioTower
    if (role === "meshBin") return Trash2
    return GatewayBinIcon
}

// Devices at the same spot would hide each other on the map. Each one in such a
// group gets a sideways shift in pixels, so they stand side by side at any zoom
// while their location stays the same.
const COLOCATED_SPACING_PX = 32
export function getColocatedShifts(bins) {
    const groups = new Map()
    for (const bin of bins ?? []) {
        const [lat, lng] = bin.location?.coordinates ?? []
        if (typeof lat !== "number" || typeof lng !== "number") continue
        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
        groups.set(key, [...(groups.get(key) ?? []), bin._id])
    }
    const shifts = {}
    for (const ids of groups.values()) {
        ids.forEach((id, index) => {
            shifts[id] = (index - (ids.length - 1) / 2) * COLOCATED_SPACING_PX
        })
    }
    return shifts
}
