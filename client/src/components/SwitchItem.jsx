import { TooltipContent } from "@radix-ui/react-tooltip"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Tooltip, TooltipTrigger } from "./ui/tooltip"

function SwitchItem({ checked, onCheckedChange, disabled = false, id, toolTip, label, switchClassName, labelClassName, toolTipClassName }) {
    return (
        toolTip ? <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <Switch disabled={disabled} checked={checked} onCheckedChange={onCheckedChange} className={switchClassName} id={id} />
                    <Label className={'hidden'} htmlFor={id}></Label>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p className={toolTipClassName}>{label}</p>
            </TooltipContent>
        </Tooltip>
            :
            <div className="flex items-center space-x-2">
                <Switch disabled={disabled} checked={checked} onCheckedChange={onCheckedChange} className={switchClassName} id={id} />
                <Label className={labelClassName} htmlFor={id}>{label}</Label>
            </div>


    )
}

export default SwitchItem
