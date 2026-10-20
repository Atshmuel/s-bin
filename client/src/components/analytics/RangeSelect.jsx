import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppSide } from "@/contexts/AppSideProvider"
import { ANALYTICS_RANGES_DAYS as ANALYTICS_RANGES } from "@/utils/constants"


// The range picker of the analytics charts.
function RangeSelect({ value, onChange, className }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    return (
        <Select isRight={isRight} value={String(value)} onValueChange={(next) => onChange(Number(next))}>
            <SelectTrigger isRight={isRight} className={className} aria-label={t("pages.binDetails.areaChart.range")}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
                {[...ANALYTICS_RANGES].reverse().map((days) => (
                    <SelectItem isRight={isRight} key={days} value={String(days)} className="rounded-lg">
                        {t("pages.binDetails.areaChart.lastDays", { count: days })}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export default RangeSelect
