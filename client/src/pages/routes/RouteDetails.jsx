import { Link, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight, CircleCheck, CircleHelp, CircleX } from "lucide-react"
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog"
import RouteMap from "@/components/routes/RouteMap"
import { RouteDriverSelect, RouteStatusBadge } from "@/components/routes/RouteParts"
import { routeDuration, routeTitle } from "@/utils/routes"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSide } from "@/hooks/useAppSide"
import { useDeleteRoute, useRoute, useUpdateRoute } from "@/hooks/routes/useRoutes"
import { useMe } from "@/hooks/users/auth/useMe"
import { getMeshSettings } from "@/services/apiMeshSettings"
import { truckName } from "@/utils/orgSettings"

const STOP_VARIANTS = Object.freeze({ planned: "outline", done: "active", skipped: "inactive" })
const VERIFICATION_ICONS = Object.freeze({
    confirmed: [CircleCheck, "text-green-600"],
    contradicted: [CircleX, "text-red-600"],
    unverified: [CircleHelp, "text-muted-foreground"],
})

// The route's truck: a picker of the organization's truck types for owners and
// admins while a collection is open (the server checks the load fits).
function RouteTruckSelect({ route }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { isAdmin } = useMe()
    const editable = isAdmin && route.type === "collection" && ["planned", "driving"].includes(route.status)
    const settingsQuery = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings, enabled: editable })
    const fleet = settingsQuery.data?.organizations?.find(org => org._id === route.orgId)?.fleet ?? []
    const mutation = useUpdateRoute()
    if (!editable || fleet.length === 0) return <span>{routeTitle(route, t)}</span>
    return (
        <Select value={route.truck?.truckTypeId ?? ""} disabled={mutation.isPending}
            onValueChange={(value) => mutation.mutate({ id: route._id, truckTypeId: value })}>
            <SelectTrigger isRight={isRight} className="w-56" aria-label={t("mapLegend.route.truck")}><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1000]">
                {fleet.map(truck => (
                    <SelectItem isRight={isRight} key={truck._id} value={truck._id}>
                        {t("mapLegend.route.truckOption", { name: truckName(truck, t), kg: truck.capacityKg.toLocaleString() })}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

function Detail({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="text-sm">{children}</div>
        </div>
    )
}

// One route: what it is and who drives it, its map with its own key, and its
// stops in driving order with what the driver marked and what the bins'
// reports said about it. Owners and admins change the driver or the truck, or
// cancel it, while it is open; owners can also delete it (mistakes, test data).
function RouteDetails() {
    const { id } = useParams()
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const navigate = useNavigate()
    const { isAdmin, isOwner } = useMe()
    const { route, isLoadingRoute, routeError } = useRoute(id)
    const cancel = useUpdateRoute()
    const remove = useDeleteRoute(() => navigate("/routes", { replace: true }))

    if (isLoadingRoute) return <Skeleton className="h-[70vh] w-full" />
    if (routeError || !route) return <p className="p-10 text-muted-foreground">{routeError?.message ?? t("pages.routes.details.notFound")}</p>

    const isOpen = ["planned", "driving"].includes(route.status)
    const BackIcon = isRight ? ArrowLeft : ArrowRight
    return (
        <div className="flex flex-col gap-4 sm:p-6">
            <Link to="/routes" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <BackIcon size={16} />{t("pages.routes.details.back")}
            </Link>
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-3">
                        {routeTitle(route, t)}
                        <RouteStatusBadge status={route.status} />
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                        {isAdmin && isOpen && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="outline" className="text-destructive">{t("pages.routes.details.cancel")}</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("pages.routes.details.cancelTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>{t("pages.routes.details.cancelDescription")}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => cancel.mutate({ id: route._id, status: "cancelled" })}>
                                            {t("pages.routes.details.cancel")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {isOwner && (
                            <ConfirmDeleteDialog
                                trigger={<Button type="button" variant="destructive">{t("pages.routes.details.delete")}</Button>}
                                title={t("pages.routes.details.deleteTitle")}
                                description={t("pages.routes.details.deleteDescription")}
                                inputLabel={t("pages.routes.details.deleteInput")}
                                isDeleting={remove.isPending}
                                onConfirm={() => remove.mutate({ id: route._id })} />
                        )}
                    </div>
                </CardHeader>
                {/* Who and what first (pickers need room), then the route's figures. */}
                <CardContent className="flex flex-col gap-5">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        <Detail label={t("mapLegend.route.truck")}><RouteTruckSelect route={route} /></Detail>
                        <Detail label={t("pages.routes.columns.driver")}><RouteDriverSelect route={route} className="w-56" /></Detail>
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Detail label={t("pages.routes.day")}>{route.serviceDay}</Detail>
                        <Detail label={t("pages.routes.columns.progress")}>
                            {t("pages.routes.progress", { done: route.stops.filter(stop => stop.status === "done").length, count: route.stops.length })}
                        </Detail>
                        <Detail label={t("pages.routes.columns.distance")}>
                            {((route.distanceMeters ?? 0) / 1000).toFixed(1)} {t("mapLegend.search.kilometers")} · {routeDuration(route.durationSeconds ?? 0, t)}
                        </Detail>
                        <Detail label={t("pages.routes.columns.load")}>
                            {route.loadKg == null ? "—" : t("pages.routes.load", { load: route.loadKg.toLocaleString(), capacity: route.truck?.capacityKg?.toLocaleString() ?? "—" })}
                            {route.leftOut > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">{t("mapLegend.route.leftOut", { count: route.leftOut })}</p>}
                        </Detail>
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="h-[60vh] min-h-80"><RouteMap route={route} /></div>
                <Card className="max-h-[60vh] min-h-80 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base">{t("mapLegend.route.stopsTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto">
                        <ol className="flex flex-col divide-y">
                            {route.stops.map(stop => {
                                const [VerificationIcon, verificationColor] = VERIFICATION_ICONS[stop.verification?.status] ?? []
                                return (
                                    <li key={stop.binId} className="flex items-start gap-3 py-2 text-sm">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white">{stop.order}</span>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <Link to={`/bins/${stop.binId}`} className="truncate font-medium hover:underline" dir="auto">{stop.binName}</Link>
                                            <span className="text-xs text-muted-foreground">
                                                {t("mapLegend.route.stopRow", { percent: Math.round(stop.fullnessAtPlan ?? 0) })}
                                                {stop.loadKg != null && <> · {t("mapLegend.route.stopLoad", { kg: stop.loadKg.toLocaleString() })}</>}
                                            </span>
                                            {stop.claim && (
                                                <span className="text-xs text-muted-foreground">
                                                    {t("pages.routes.details.claimed", { time: new Date(stop.claim.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                                                    {stop.claim.distanceMeters != null && <> · {t("pages.routes.details.claimDistance", { meters: Math.round(stop.claim.distanceMeters) })}</>}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {VerificationIcon && (
                                                <span title={t(`pages.routes.verification.${stop.verification.status}`)}>
                                                    <VerificationIcon size={16} className={verificationColor} />
                                                </span>
                                            )}
                                            <Badge variant={STOP_VARIANTS[stop.status] ?? "outline"}>{t(`pages.routes.stopStatuses.${stop.status}`)}</Badge>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default RouteDetails
