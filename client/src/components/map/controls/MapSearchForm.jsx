import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DEFAULT_SEARCH_FULLNESS as DEFAULT_FULLNESS, DEFAULT_RADIUS_KM, MAX_RADIUS_KM } from "@/utils/constants"
import ChoiceGroup from "./ChoiceGroup"

const HEALTH_OPTIONS = ["good", "warning", "critical", "all"]

// Searching the map: the bins within a radius of the user's location (or the
// map's center), by fullness and health. The search lives in the URL, which
// the map reads, so it survives a refresh or a link.
function MapSearchForm({ map, userMarker }) {
    const { t } = useTranslation()
    const [searchParams, setSearchParams] = useSearchParams()
    const params = Object.fromEntries(searchParams)
    const isFiltered = Boolean(params.radius || params.minLevel || params.maxLevel || params.health)

    const [radius, setRadius] = useState(Number(params.radius) || DEFAULT_RADIUS_KM)
    const [fullness, setFullness] = useState([
        params.minLevel !== undefined ? Number(params.minLevel) : DEFAULT_FULLNESS[0],
        params.maxLevel !== undefined ? Number(params.maxLevel) : DEFAULT_FULLNESS[1],
    ])
    const [health, setHealth] = useState(params.health ?? "all")

    // From the user's location when known, otherwise from the map's center.
    const origin = () => userMarker
        ? `${userMarker.lat},${userMarker.lng}`
        : `${map.getCenter().lat},${map.getCenter().lng}`

    function applyFilters() {
        setSearchParams({
            radius,
            minLevel: fullness[0],
            maxLevel: fullness[1],
            health,
            coordinates: origin(),
            zoom: map.getZoom(),
        })
    }

    return (
        <section className="flex flex-col gap-4">
            <h4 className="text-sm font-medium">{t("mapLegend.search.title")}</h4>
            <div className="flex flex-col gap-3">
                <Label>{t("mapLegend.search.binRadius")}: {radius} {t("mapLegend.search.kilometers")}</Label>
                <Slider min={1} max={MAX_RADIUS_KM} step={1} value={[radius]} onValueChange={([value]) => setRadius(value)} />
            </div>
            <div className="flex flex-col gap-3">
                <Label>{t("mapLegend.search.fillLevel")}: <span dir="ltr">{fullness[0]}% – {fullness[1]}%</span></Label>
                <Slider min={0} max={100} step={1} value={fullness} onValueChange={setFullness} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("mapLegend.search.healthStatus")}</Label>
                <ChoiceGroup value={health} onChange={setHealth} label={t("mapLegend.search.healthStatus")}
                    options={HEALTH_OPTIONS.map((option) => [option, t(`levels.${option}`)])} />
            </div>
            <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={applyFilters}>
                    <Filter data-icon="inline-start" />
                    {t("filter")}
                </Button>
                {isFiltered && (
                    <Button type="button" variant="outline" size="icon" onClick={() => setSearchParams({})}
                        aria-label={t("mapLegend.search.clearFilters")} title={t("mapLegend.search.clearFilters")}>
                        <X />
                    </Button>
                )}
            </div>
        </section>
    )
}

export default MapSearchForm
