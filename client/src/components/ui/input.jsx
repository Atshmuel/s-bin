import * as React from "react"

import { cn } from "@/lib/utils"
import { useAppSide } from "@/contexts/AppSideProvider"

function Input({
  className,
  type,
  withIcon = false,
  Icon,
  iconClassName = "",
  iconSize = 18,
  onIconClick,
  ...props
}) {
  const { isRight } = useAppSide()

  return !withIcon ? (<input
    type={type}
    data-slot="input"
    className={
      cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  text-ellipsis",
        className,
        isRight ? "pr-10" : "pl-10"
      )
    }
    {...props} />) : (
    <div className="relative">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-ellipsis",
          className,
          isRight ? "pr-10" : "pl-10"
        )}
        {...props} />
      <Icon onClick={onIconClick} size={iconSize} className={`absolute top-[9px] ${isRight ? "right-2" : "left-2"} ${iconClassName} ${props.disabled ? "opacity-30" : ""}`} />
    </div>
  )

}

export { Input }
