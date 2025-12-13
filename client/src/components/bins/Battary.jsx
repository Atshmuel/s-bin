import { getColor } from "@/utils/binHelpers"
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

function Battary({ level }) {
    const color = getColor(level, "battery")

    return (
        <Tooltip >
            <TooltipTrigger asChild>
                <p className="w-fit" >
                    {
                        level > 75 ? <BatteryFull color={color} /> :
                            level > 50 ? <BatteryMedium color={color} /> : <BatteryLow color={color} />
                    }
                </p >
            </TooltipTrigger>
            <TooltipContent className={'z-999'}>{level}%</TooltipContent>
        </Tooltip>
    )
}

export default Battary
