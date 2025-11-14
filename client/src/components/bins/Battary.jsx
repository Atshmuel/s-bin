import { getColor } from "@/utils/binHelpers"
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

function Battary({ level }) {
    const color = getColor(level, "battery")

    return (
        <Tooltip >
            <TooltipTrigger asChild>
                <span >
                    {
                        level > 75 ? <BatteryFull color={color} /> :
                            level > 50 ? <BatteryMedium color={color} /> : <BatteryLow color={color} />
                    }
                </span>
            </TooltipTrigger>
            <TooltipContent>{level}%</TooltipContent>
        </Tooltip>
    )
}

export default Battary
