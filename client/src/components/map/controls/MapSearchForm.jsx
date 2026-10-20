import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Filter, RouteIcon, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAppSide } from "@/contexts/AppSideProvider"
import { getBestRoute } from "@/services/apiBins"
import { DEFAULT_COLLECTION_FULLNESS as DEFAULT_FULLNESS, DEFAULT_RADIUS_KM, MAX_RADIUS_KM } from "@/utils/constants"

const HEALTH_OPTIONS = ["good", "warning", "critical", "all"]
const ROUTE_TYPES = ["collection", "maintenance"]

// A single-choice row of toggles that never ends up with nothing chosen.
function ChoiceGroup({ value, onChange, options, label }) {
    const { isRight } = useAppSide()
    return (
        <ToggleGroup type="single" variant="outline" size="sm" isRight={isRight} className="w-full"
            value={value} onValueChange={(next) => next && onChange(next)} aria-label={label}>
            {options.map(([option, text]) => (
                <ToggleGroupItem key={option} value={option}
                    className="flex-1 px-1 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:text-sm">
                    {text}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

// Searching the map (bins within a radius, by fullness and health) and planning
// a route through what the search finds: a collection through the bins in the
// fullness range, a maintenance visit through the devices in the health
// filter, gateways included. Both live in the URL,
// which the map reads, so a search or a route survives a refresh or a link.
function MapSearchForm({ map, userMarker }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const [searchParams, setSearchParams] = useSearchParams()
    const params = Object.fromEntries(searchParams)

    const isRouted = Boolean(params.route)
    const isFiltered = !isRouted && !params.type &&
        Boolean(params.radius || params.minLevel || params.maxLevel || params.health)

    const [radius, setRadius] = useState(Number(params.radius) || DEFAULT_RADIUS_KM)
    const [fullness, setFullness] = useState([
        params.minLevel !== undefined ? Number(params.minLevel) : DEFAULT_FULLNESS[0],
        params.maxLevel !== undefined ? Number(params.maxLevel) : DEFAULT_FULLNESS[1],
    ])
    const [health, setHealth] = useState(params.health ?? "all")
    const [routeType, setRouteType] = useState(params.type ?? "collection")
    const [byFoot, setByFoot] = useState(params.byFoot === "true")
    const [isRouting, setIsRouting] = useState(false)

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

    async function planRoute() {
        const coordinates = origin()
        setIsRouting(true)
        setSearchParams({ coordinates, radius, type: routeType, byFoot: String(byFoot) })
        try {
            const response = await getBestRoute({
                coordinates, radius, type: routeType, byFoot,
                minLevel: fullness[0], maxLevel: fullness[1], health,
            })
            // No bins match: say which, rather than a failure.
            if (!response.route || response.route.length === 0) {
                setSearchParams({})
                toast.info(routeType === "collection"
                    ? t("mapLegend.route.noBinsCollection", { radius, min: fullness[0], max: fullness[1] })
                    : t("mapLegend.route.noBinsMaintenance", { radius, health: t(`levels.${health}`) }))
                return
            }
            setSearchParams({
                route: response.route.geometry,
                zoom: 17,
                coordinates: response.binsData[0].location.coordinates.join(","),
            })
            toast.success(t("toasts.routeCalculated", { distance: (response.route.distance / 1000).toFixed(2) }))
        } catch (error) {
            setSearchParams({})
            toast.error(error.message || t("toasts.failedToGetRoutes"))
        } finally {
            setIsRouting(false)
        }
    }

    const clear = () => setSearchParams({})

    return (
        <>
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
                        <Button type="button" variant="outline" size="icon" onClick={clear} aria-label={t("mapLegend.search.clearFilters")}
                            title={t("mapLegend.search.clearFilters")}>
                            <X />
                        </Button>
                    )}
                </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-medium">{t("mapLegend.route.title")}</h4>
                    <p className="text-xs text-muted-foreground">{t("mapLegend.route.description")}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <Label>{t("mapLegend.route.type")}</Label>
                    <ChoiceGroup value={routeType} onChange={setRouteType} label={t("mapLegend.route.type")}
                        options={ROUTE_TYPES.map((type) => [type, t(`mapLegend.route.${type}`)])} />
                </div>
                <div className="flex items-center gap-2">
                    <Switch isRight={isRight} id="map-by-foot" checked={byFoot} onCheckedChange={setByFoot} />
                    <Label htmlFor="map-by-foot" className="text-sm">{t("mapLegend.route.byFoot")}</Label>
                </div>
                <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={planRoute} disabled={isRouting}>
                        {isRouting ? <Spinner data-icon="inline-start" /> : <RouteIcon data-icon="inline-start" />}
                        {t("route")}
                    </Button>
                    {isRouted && (
                        <Button type="button" variant="outline" size="icon" onClick={clear} aria-label={t("mapLegend.route.clear")}
                            title={t("mapLegend.route.clear")}>
                            <X />
                        </Button>
                    )}
                </div>
            </section>
        </>
    )
}

export default MapSearchForm
