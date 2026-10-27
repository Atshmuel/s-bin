import { batteryState, getColor } from "@/utils/binHelpers"
import { useThresholds } from "@/hooks/useThresholds"
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"
import { MobileTooltip } from "../ui/mobile-tooltip"

const ICONS = { good: BatteryFull, warning: BatteryMedium, critical: BatteryLow }

// A battery's icon and color, by its device's organization's cut-offs
// (`ownerId`; without one, the page's).
function Battary({ level, ownerId }) {
    const { thresholdsFor } = useThresholds()
    const thresholds = thresholdsFor(ownerId)
    const Icon = ICONS[batteryState(level, thresholds)]

    return (
        <MobileTooltip content={`${level}%`} className={'z-999'}>
            <p className="w-fit">
                <Icon color={getColor(level, "battery", thresholds)} />
            </p>
        </MobileTooltip>
    )
}

export default Battary
