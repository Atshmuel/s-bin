import { getColor } from "@/utils/binHelpers"
import { BATTERY_CRITICAL_PERCENT, BATTERY_WARNING_PERCENT } from "@/utils/constants"
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"
import { MobileTooltip } from "../ui/mobile-tooltip"

function Battary({ level }) {
    const color = getColor(level, "battery")

    return (
        <MobileTooltip content={`${level}%`} className={'z-999'}>
            <p className="w-fit">
                {
                    level > BATTERY_WARNING_PERCENT ? <BatteryFull color={color} /> :
                        level > BATTERY_CRITICAL_PERCENT ? <BatteryMedium color={color} /> :
                            <BatteryLow color={color} />
                }
            </p>
        </MobileTooltip>
    )
}

export default Battary
