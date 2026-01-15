import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * A tooltip wrapper that works on both desktop (hover) and mobile (tap).
 * On mobile devices, the tooltip opens on click and auto-closes after a delay.
 */
function MobileTooltip({ children, content, delayDuration = 2000, ...props }) {
    const isMobile = useIsMobile()
    const [open, setOpen] = React.useState(false)
    const timeoutRef = React.useRef(null)

    const handleClick = React.useCallback(() => {
        if (isMobile) {
            setOpen(true)
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            // Auto-close after delay
            timeoutRef.current = setTimeout(() => {
                setOpen(false)
            }, delayDuration)
        }
    }, [isMobile, delayDuration])

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // For mobile: controlled tooltip that opens on click
    // For desktop: uncontrolled tooltip that opens on hover
    if (isMobile) {
        return (
            <Tooltip open={open} onOpenChange={setOpen}>
                <TooltipTrigger asChild onClick={handleClick}>
                    {children}
                </TooltipTrigger>
                <TooltipContent {...props}>{content}</TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent {...props}>{content}</TooltipContent>
        </Tooltip>
    )
}

export { MobileTooltip }
