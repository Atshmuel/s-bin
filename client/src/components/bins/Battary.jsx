import { getColor } from "@/utils/binHelpers"
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"
import { MobileTooltip } from "../ui/mobile-tooltip"

function Battary({ level }) {
    const color = getColor(level, "battery")

    return (
        <MobileTooltip content={`${level}%`} className={'z-999'}>
            <p className="w-fit">
                {
                    level > 75 ? <BatteryFull color={color} /> :
                        level > 50 ? <BatteryMedium color={color} /> :
                            <BatteryLow color={color} />
                }
            </p>
        </MobileTooltip>
    )
}

export default Battary
