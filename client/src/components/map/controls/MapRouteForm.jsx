import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Navigation, RouteIcon, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { useAppSide } from "@/hooks/useAppSide"
import { useMapSettings } from "@/hooks/useMapSettings"
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg"
import { useMe } from "@/hooks/users/auth/useMe"
import { getBestRoute } from "@/services/apiBins"
import { getMeshSettings } from "@/services/apiMeshSettings"
import { DEFAULT_ROUTE_MIN_FULLNESS, DEFAULT_ROUTE_RADIUS_KM, MAX_RADIUS_KM } from "@/utils/constants"
import { ROUTE_COLOR } from "@/utils/mapClusters"
import { truckName } from "@/utils/orgSettings"
import { toLatLng } from "@/utils/geo"
import ChoiceGroup from "./ChoiceGroup"

const ROUTE_TYPES = ["collection", "maintenance"]
const MAINTENANCE_HEALTH = ["warning", "critical", "all"]

// Planning one route: a collection for one of the organization's trucks (the
// fullest bins it can carry, from a minimum fullness up), or a maintenance
// visit through the devices in poor health, gateways included; within a radius
// of the start, which is the depot when the organization has one. The route
// lives in the map's state, and the map shows it on its own.
function MapRouteForm({ map, userMarker }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { isOwner } = useMe()
    const { selectedOrgId } = useSelectedOrg()
    const { routePlan, setRoutePlan, setOpenPanel } = useMapSettings()

    const [routeType, setRouteType] = useState("collection")
    const [radius, setRadius] = useState(DEFAULT_ROUTE_RADIUS_KM)
    const [minFullness, setMinFullness] = useState(DEFAULT_ROUTE_MIN_FULLNESS)
    const [health, setHealth] = useState("critical")
    const [isRouting, setIsRouting] = useState(false)

    // The organizations a route can be planned for, with their trucks: an
    // owner's every one (the one picked on the dashboard first), anyone else's own.
    const settingsQuery = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings })
    const organizations = settingsQuery.data?.organizations ?? []
    const [orgChoice, setOrgChoice] = useState(null)
    const orgId = orgChoice ?? (isOwner ? (selectedOrgId ?? organizations[0]?._id) : organizations[0]?._id) ?? null
    const organization = organizations.find(org => org._id === orgId)
    const fleet = organization?.fleet ?? []
    const [truckChoice, setTruckChoice] = useState(null)
    const truckTypeId = fleet.some(truck => truck._id === truckChoice) ? truckChoice : fleet[0]?._id ?? null

    // From the user's location when known, otherwise from the map's center
    // (the depot replaces both on the server when the organization has one).
    const origin = () => userMarker
        ? `${userMarker.lat},${userMarker.lng}`
        : `${map.getCenter().lat},${map.getCenter().lng}`

    async function planRoute() {
        setIsRouting(true)
        try {
            const response = await getBestRoute({
                coordinates: origin(), radius, type: routeType,
                ...(routeType === "collection" ? { minLevel: minFullness, maxLevel: 100 } : { health }),
                ...(isOwner && orgId ? { orgId } : {}),
                ...(routeType === "collection" && truckTypeId ? { truckTypeId } : {}),
            })
            // No bins match: say which, rather than a failure.
            if (!response.stops?.length) {
                setRoutePlan(null)
                toast.info(routeType === "collection"
                    ? t("mapLegend.route.noBinsCollection", { radius, min: minFullness, max: 100 })
                    : t("mapLegend.route.noBinsMaintenance", { radius, health: t(`levels.${health}`) }))
                return
            }
            setRoutePlan({
                type: routeType,
                geometry: response.route.geometry,
                distance: response.route.distance,
                duration: response.route.duration,
                start: response.start,
                end: response.end,
                fromDepot: response.fromDepot,
                truck: response.truck,
                loadKg: response.loadKg,
                leftOut: response.leftOut,
                stops: response.stops,
            })
            map.flyToBounds([response.start, ...response.stops.map(stop => stop.location.coordinates)].map(toLatLng), { padding: [32, 32] })
        } catch (error) {
            setRoutePlan(null)
            toast.error(error.message || t("toasts.failedToGetRoutes"))
        } finally {
            setIsRouting(false)
        }
    }

    const selectRow = (label, value, onChange, options) => (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <Select value={value ?? ""} onValueChange={onChange}>
                <SelectTrigger isRight={isRight} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1000]">
                    {options.map(([optionValue, text]) => <SelectItem isRight={isRight} key={optionValue} value={optionValue}>{text}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    )

    return (
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
            {isOwner && organizations.length > 1 && selectRow(t("mapLegend.route.organization"), orgId,
                (value) => { setOrgChoice(value); setTruckChoice(null) },
                organizations.map(org => [org._id, org.name]))}
            {routeType === "collection" && (fleet.length > 0
                ? selectRow(t("mapLegend.route.truck"), truckTypeId, setTruckChoice,
                    fleet.map(truck => [truck._id, t("mapLegend.route.truckOption", { name: truckName(truck, t), kg: truck.capacityKg.toLocaleString() })]))
                : <p className="text-xs text-muted-foreground">{t("mapLegend.route.noFleet")}</p>)}
            <div className="flex flex-col gap-3">
                <Label>{t("mapLegend.search.binRadius")}: {radius} {t("mapLegend.search.kilometers")}</Label>
                <Slider min={1} max={MAX_RADIUS_KM} step={1} value={[radius]} onValueChange={([value]) => setRadius(value)} />
            </div>
            {routeType === "collection" ? (
                <div className="flex flex-col gap-3">
                    <Label>{t("mapLegend.route.minFullness", { percent: minFullness })}</Label>
                    <Slider min={0} max={100} step={5} value={[minFullness]} onValueChange={([value]) => setMinFullness(value)} />
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Label>{t("mapLegend.search.healthStatus")}</Label>
                    <ChoiceGroup value={health} onChange={setHealth} label={t("mapLegend.search.healthStatus")}
                        options={MAINTENANCE_HEALTH.map((option) => [option, t(`levels.${option}`)])} />
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                {organization?.depot ? t("mapLegend.route.fromDepot") : t("mapLegend.route.fromHere")}
            </p>
            <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={planRoute} disabled={isRouting}>
                    {isRouting ? <Spinner data-icon="inline-start" /> : <RouteIcon data-icon="inline-start" />}
                    {t("route")}
                </Button>
                {routePlan && (
                    <Button type="button" variant="outline" size="icon" onClick={() => setRoutePlan(null)}
                        aria-label={t("mapLegend.route.clear")} title={t("mapLegend.route.clear")}>
                        <X />
                    </Button>
                )}
            </div>
            {routePlan && (
                <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3 text-xs" role="status">
                    <span className="text-sm font-medium">
                        {t("mapLegend.route.summaryStops", { count: routePlan.stops.length })}
                        {" · "}{(routePlan.distance / 1000).toFixed(1)} {t("mapLegend.search.kilometers")}
                        {" · "}{t("mapLegend.route.summaryTime", { hours: Math.floor(routePlan.duration / 3600), minutes: Math.round(routePlan.duration % 3600 / 60) })}
                    </span>
                    {routePlan.truck && (
                        <span>{t("mapLegend.route.summaryLoad", { load: routePlan.loadKg.toLocaleString(), capacity: routePlan.truck.capacityKg.toLocaleString(), truck: truckName(routePlan.truck, t) })}</span>
                    )}
                    <span>{routePlan.fromDepot ? t("mapLegend.route.startsAtDepot") : t("mapLegend.route.startsHere")}</span>
                    {routePlan.leftOut > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">{t("mapLegend.route.leftOut", { count: routePlan.leftOut })}</span>
                    )}
                    {routePlan.doneIds?.length > 0 && (
                        <span>{t("mapLegend.drive.progress", { done: routePlan.doneIds.length, count: routePlan.stops.length })}</span>
                    )}
                    <Button type="button" size="sm" className="mt-2" onClick={() => {
                        setRoutePlan({ ...routePlan, driving: true, doneIds: routePlan.doneIds ?? [] })
                        setOpenPanel(null)
                    }}>
                        <Navigation data-icon="inline-start" />{t(routePlan.driving ? "mapLegend.drive.resume" : "mapLegend.drive.start")}
                    </Button>
                </div>
            )}
            {routePlan && (
                <div className="flex flex-col gap-2">
                    <div>
                        <h5 className="text-sm font-medium">{t("mapLegend.route.stopsTitle")}</h5>
                        <p className="text-xs text-muted-foreground">{t("mapLegend.route.stopsHint")}</p>
                    </div>
                    <ol className="flex max-h-64 flex-col overflow-y-auto rounded-md border">
                        {routePlan.stops.map(stop => (
                            <li key={stop._id} className="border-b last:border-b-0">
                                <button type="button" onClick={() => map.flyTo(toLatLng(stop.location.coordinates), 17)}
                                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-start text-xs hover:bg-muted">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full font-bold text-white"
                                        style={{ background: ROUTE_COLOR }}>{stop.order}</span>
                                    <span className="min-w-0 flex-1 truncate font-medium" dir="auto">{stop.binName}</span>
                                    <span className="shrink-0 text-muted-foreground">
                                        {t("mapLegend.route.stopRow", { percent: Math.round(stop.fullness ?? 0) })}
                                        {stop.loadKg != null && <> · {t("mapLegend.route.stopLoad", { kg: stop.loadKg.toLocaleString() })}</>}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </section>
    )
}

export default MapRouteForm
