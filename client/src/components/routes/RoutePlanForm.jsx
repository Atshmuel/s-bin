import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Locate, RouteIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import ChoiceGroup from "@/components/map/controls/ChoiceGroup"
import PlanAreaMap from "@/components/routes/PlanAreaMap"
import { useAppSide } from "@/hooks/useAppSide"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useCreateRoute } from "@/hooks/routes/useRoutes"
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg"
import { useMe } from "@/hooks/users/auth/useMe"
import { getBinsInUserRadius } from "@/services/apiBins"
import { getMeshSettings } from "@/services/apiMeshSettings"
import { getFullness } from "@/utils/binHelpers"
import {
    DEFAULT_ROUTE_RADIUS_KM, DEFAULT_THRESHOLDS, ROUTE_AREA_MAX_RADIUS_KM, ROUTE_AREA_RADIUS_STEP_KM, WEIGHT_REFERENCE_KG,
} from "@/utils/constants"
import { toLatLng } from "@/utils/geo"
import { truckName } from "@/utils/orgSettings"

const ROUTE_TYPES = ["collection", "maintenance"]
const MAINTENANCE_HEALTH = ["warning", "critical", "all"]
const AREA_SEARCH_DEBOUNCE_MS = 300

// A bin's expected load in kg, as the server counts it: a working scale's
// weight, or else its fullness of a full bin's weight.
function binLoadKg(bin) {
    const kg = bin.status?.scale === "ok" && Number.isFinite(bin.status?.weight)
        ? bin.status.weight
        : getFullness(bin.status).combined / 100 * WEIGHT_REFERENCE_KG
    return Math.max(Math.ceil(kg), 1)
}

// How many of the bins a truck takes, the fullest first.
function binsThatFit(bins, capacityKg) {
    let load = 0, count = 0
    for (const bin of [...bins].sort((a, b) => getFullness(b.status).combined - getFullness(a.status).combined)) {
        if (load + binLoadKg(bin) > capacityKg) continue
        load += binLoadKg(bin)
        count++
    }
    return count
}

// Planning a route by hand (owners and admins): a collection for one of the
// organization's trucks (the fullest bins it can carry, from a minimum
// fullness up; the type's first truck still free today), or a maintenance
// visit through the devices in poor health, gateways included; within an area
// on the map (around the depot at first; a click moves it). The route starts
// and ends at the organization's depot. The map shows the bins a route could
// take there (none held by another route) and how many fit the truck. Calls
// onPlanned with the stored route.
function RoutePlanForm({ onPlanned }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { isOwner } = useMe()
    const { selectedOrgId } = useSelectedOrg()

    const [routeType, setRouteType] = useState("collection")
    const [radius, setRadius] = useState(DEFAULT_ROUTE_RADIUS_KM)
    // Until the user moves it, the organization's critical fullness.
    const [minFullnessChoice, setMinFullness] = useState(null)
    const [health, setHealth] = useState("critical")

    // The organizations a route can be planned for, with their trucks and depot:
    // an owner's every one (the one picked for the pages first), anyone else's own.
    const settingsQuery = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings })
    const organizations = settingsQuery.data?.organizations ?? []
    const [orgChoice, setOrgChoice] = useState(null)
    const orgId = orgChoice ?? (isOwner ? (selectedOrgId ?? organizations[0]?._id) : organizations[0]?._id) ?? null
    const organization = organizations.find(org => org._id === orgId)
    const thresholds = { ...DEFAULT_THRESHOLDS, ...organization?.thresholds }
    const minFullness = minFullnessChoice ?? thresholds.fullnessCritical
    const fleet = organization?.fleet ?? []
    const [truckChoice, setTruckChoice] = useState(null)
    const truckTypeId = fleet.some(truck => truck._id === truckChoice) ? truckChoice : fleet[0]?._id ?? null
    const depot = organization?.depot?.location
    const truck = fleet.find(type => type._id === truckTypeId)

    // The collection area's centre, [lng, lat]: the depot until a click moves it.
    const [moved, setMoved] = useState({ orgId: null, center: null })
    const center = (moved.orgId === orgId && moved.center) || depot

    // The bins a route could take in the area, once the fields stop changing.
    const search = useDebouncedValue(JSON.stringify({ orgId, center, radius, routeType, minFullness, health }), AREA_SEARCH_DEBOUNCE_MS)
    const areaQuery = useQuery({
        queryKey: ["plan-area", search],
        queryFn: () => {
            const area = JSON.parse(search)
            return getBinsInUserRadius({
                coordinates: toLatLng(area.center), radius: area.radius, excludeReserved: true,
                org: isOwner ? area.orgId : null,
                ...(area.routeType === "collection" ? { minLevel: area.minFullness, maxLevel: 100 } : { health: area.health }),
            })
        },
        enabled: Boolean(center),
        placeholderData: keepPreviousData,
    })
    const areaBins = areaQuery.data?.binsData ?? []

    const mutation = useCreateRoute((data) => {
        if (data.route) {
            onPlanned?.(data.route)
            return
        }
        // Nothing matched or fitted: say which, rather than a failure.
        toast.info(data.reason === "noFit" ? t("pages.routes.plan.noFit")
            : routeType === "collection"
                ? t("mapLegend.route.noBinsCollection", { radius, min: minFullness, max: 100 })
                : t("mapLegend.route.noBinsMaintenance", { radius, health: t(`levels.${health}`) }))
    })

    const planRoute = () => mutation.mutate({
        type: routeType,
        coordinates: center,
        radius: radius * 1000,
        ...(routeType === "collection" ? { minLevel: minFullness, maxLevel: 100 } : { health }),
        ...(isOwner && orgId ? { orgId } : {}),
        ...(routeType === "collection" && truckTypeId ? { truckTypeId } : {}),
    })

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

    if (settingsQuery.isPending) return <Spinner className="mx-auto" />

    return (
        <div className="grid gap-6 md:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t("pages.routes.plan.description")}</p>
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
                <Label>{t("mapLegend.search.binRadius")}: {radius.toLocaleString()} {t("mapLegend.search.kilometers")}</Label>
                <Slider min={ROUTE_AREA_RADIUS_STEP_KM} max={ROUTE_AREA_MAX_RADIUS_KM} step={ROUTE_AREA_RADIUS_STEP_KM}
                    value={[radius]} onValueChange={([value]) => setRadius(value)} />
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
            {depot ? (
                <p className="text-xs text-muted-foreground">{t("mapLegend.route.fromDepot")}</p>
            ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t("pages.routes.plan.noDepot")}{" "}
                    {orgId && <Link className="underline" to={`/organizations/${orgId}/settings#depot`}>{t("pages.routes.plan.toSettings")}</Link>}
                </p>
            )}
            <Button type="button" onClick={planRoute} disabled={!depot || mutation.isPending}>
                {mutation.isPending ? <Spinner data-icon="inline-start" /> : <RouteIcon data-icon="inline-start" />}
                {t("route")}
            </Button>
        </section>
        {center && (
            <section className="flex min-h-96 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2" aria-live="polite">
                        {areaQuery.isFetching && <Spinner className="size-3.5" />}
                        {t("pages.routes.plan.matches", { count: areaBins.length })}
                        {routeType === "collection" && truck && areaBins.length > 0 && (
                            <span className="text-muted-foreground">· {t("pages.routes.plan.fit", { count: binsThatFit(areaBins, truck.capacityKg) })}</span>
                        )}
                    </span>
                    {center !== depot && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => setMoved({ orgId: null, center: null })}>
                            <Locate data-icon="inline-start" />{t("pages.routes.plan.backToDepot")}
                        </Button>
                    )}
                </div>
                <div className="min-h-80 flex-1">
                    <PlanAreaMap key={orgId} depot={depot} center={center} radiusMeters={radius * 1000} bins={areaBins} thresholds={thresholds}
                        onMove={(lngLat) => setMoved({ orgId, center: lngLat })} />
                </div>
                <p className="text-xs text-muted-foreground">{t("pages.routes.plan.clickMap")}</p>
            </section>
        )}
        </div>
    )
}

export default RoutePlanForm
