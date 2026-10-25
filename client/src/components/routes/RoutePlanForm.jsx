import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { RouteIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import ChoiceGroup from "@/components/map/controls/ChoiceGroup"
import { useAppSide } from "@/hooks/useAppSide"
import { useCreateRoute } from "@/hooks/routes/useRoutes"
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg"
import { useMe } from "@/hooks/users/auth/useMe"
import { getMeshSettings } from "@/services/apiMeshSettings"
import { DEFAULT_ROUTE_MIN_FULLNESS, DEFAULT_ROUTE_RADIUS_KM, MAX_RADIUS_KM } from "@/utils/constants"
import { truckName } from "@/utils/orgSettings"

const ROUTE_TYPES = ["collection", "maintenance"]
const MAINTENANCE_HEALTH = ["warning", "critical", "all"]

// Planning a route by hand (owners and admins): a collection for one of the
// organization's trucks (the fullest bins it can carry, from a minimum
// fullness up; the type's first truck still free today), or a maintenance
// visit through the devices in poor health, gateways included; within a
// radius of the organization's depot, where the route starts and ends.
// Calls onPlanned with the stored route.
function RoutePlanForm({ onPlanned }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { isOwner } = useMe()
    const { selectedOrgId } = useSelectedOrg()

    const [routeType, setRouteType] = useState("collection")
    const [radius, setRadius] = useState(DEFAULT_ROUTE_RADIUS_KM)
    const [minFullness, setMinFullness] = useState(DEFAULT_ROUTE_MIN_FULLNESS)
    const [health, setHealth] = useState("critical")

    // The organizations a route can be planned for, with their trucks and depot:
    // an owner's every one (the one picked for the pages first), anyone else's own.
    const settingsQuery = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings })
    const organizations = settingsQuery.data?.organizations ?? []
    const [orgChoice, setOrgChoice] = useState(null)
    const orgId = orgChoice ?? (isOwner ? (selectedOrgId ?? organizations[0]?._id) : organizations[0]?._id) ?? null
    const organization = organizations.find(org => org._id === orgId)
    const fleet = organization?.fleet ?? []
    const [truckChoice, setTruckChoice] = useState(null)
    const truckTypeId = fleet.some(truck => truck._id === truckChoice) ? truckChoice : fleet[0]?._id ?? null
    const depot = organization?.depot?.location

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
        coordinates: depot,
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
        <section className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t("mapLegend.route.description")}</p>
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
    )
}

export default RoutePlanForm
