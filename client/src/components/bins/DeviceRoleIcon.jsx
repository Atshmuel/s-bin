import { RadioTower, Trash2, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

// A bin with a SIM: it reports itself and is a gateway for nearby leaves, so
// it is drawn as a bin sending waves. The waves sit outside the bin's outline,
// with no background, so both stay readable on the map and in a badge; they
// stay on the right in both directions, the icon is a picture, not text.
export function GatewayBinIcon({ size = 24, color = "currentColor", strokeWidth = 2, className }) {
    const waveSize = Math.max(8, Math.round(size * 0.6))
    return (
        <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
            <Trash2 size={size} color={color} strokeWidth={strokeWidth} />
            <Wifi
                size={waveSize}
                color={color}
                strokeWidth={strokeWidth + 0.5}
                className="absolute rotate-45"
                style={{ top: -waveSize / 2, right: -waveSize / 2 }}
            />
        </span>
    )
}

// The icon for a device's role (see getDeviceRole): an antenna for a gateway,
// a bin sending waves for a gateway bin, a plain bin for a mesh bin.
function DeviceRoleIcon({ role, ...props }) {
    if (role === "gateway") return <RadioTower {...props} />
    if (role === "meshBin") return <Trash2 {...props} />
    return <GatewayBinIcon {...props} />
}

export default DeviceRoleIcon
