import { useState } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { enUS, he } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAppSide } from "@/hooks/useAppSide"
import { cn } from "@/lib/utils"

// "YYYY-MM-DD" as a local date and back (a day, not an instant).
const toDate = (day) => {
    const [year, month, date] = day.split("-").map(Number)
    return new Date(year, month - 1, date)
}
const toDay = (date) => format(date, "yyyy-MM-dd")

// A day picked from a calendar (shadcn's date picker), in the app's language
// and direction. `value` and `onChange` are "YYYY-MM-DD".
function DatePicker({ value, onChange, label, className }) {
    const { i18n } = useTranslation()
    const { isRight } = useAppSide()
    const [open, setOpen] = useState(false)
    const locale = i18n.language === "he" ? he : enUS
    const selected = value ? toDate(value) : undefined
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" aria-label={label}
                    className={cn("w-48 justify-start font-normal", !value && "text-muted-foreground", className)}>
                    <CalendarIcon data-icon="inline-start" />
                    {selected ? format(selected, "PPP", { locale }) : label}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selected} defaultMonth={selected} locale={locale} dir={isRight ? "ltr" : "rtl"}
                    onSelect={(date) => {
                        if (date) onChange(toDay(date))
                        setOpen(false)
                    }} />
            </PopoverContent>
        </Popover>
    )
}

export default DatePicker
