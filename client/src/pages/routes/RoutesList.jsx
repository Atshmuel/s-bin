import { useCallback, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CircleCheck, CircleX, LinkIcon, Plus } from "lucide-react"
import DataTable from "@/components/DataTable"
import DatePicker from "@/components/DatePicker"
import OrganizationSelect from "@/components/OrganizationSelect"
import RoutePlanForm from "@/components/routes/RoutePlanForm"
import { RouteDriverSelect, RouteStatusBadge } from "@/components/routes/RouteParts"
import { routeDuration, routeTitle } from "@/utils/routes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRoutes } from "@/hooks/routes/useRoutes"
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg"
import { useAppSide } from "@/hooks/useAppSide"
import { useMe } from "@/hooks/users/auth/useMe"

// A day's routes: today's by default (in the organization's time zone). Owners
// see every organization's (the picker narrows it) and admins their own's,
// with the driver assignable in the table and a route planned by hand; drivers
// see the routes they drive.
function RoutesList() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { isAdmin, isOwner } = useMe()
    const { isRight, side } = useAppSide()
    const { selectedOrgId } = useSelectedOrg()
    const [day, setDay] = useState(null)
    const { routes, serviceDay, isLoadingRoutes, routesError } = useRoutes({ day: day ?? undefined, org: selectedOrgId ?? undefined })
    const [isPlanning, setIsPlanning] = useState(false)

    const columns = [
        {
            header: t("pages.routes.columns.route"),
            accessorKey: "truck",
            cell: ({ row }) => (
                <Link className="flex items-center gap-2" to={`/routes/${row.original._id}`}>
                    <LinkIcon size={14} /><span>{routeTitle(row.original, t)}</span>
                </Link>
            ),
        },
        ...(isOwner && !selectedOrgId ? [{ header: t("pages.routes.columns.organization"), accessorKey: "orgName" }] : []),
        {
            header: t("pages.routes.columns.driver"),
            accessorKey: "driverName",
            cell: ({ row }) => <RouteDriverSelect route={row.original} />,
        },
        {
            header: t("pages.routes.columns.progress"),
            accessorKey: "doneCount",
            cell: ({ row }) => {
                const { doneCount, skippedCount, stopCount } = row.original
                return <span>{t("pages.routes.progress", { done: doneCount, count: stopCount })}{skippedCount > 0 && ` · ${t("pages.routes.skipped", { count: skippedCount })}`}</span>
            },
        },
        {
            header: t("pages.routes.columns.load"),
            accessorKey: "loadKg",
            cell: ({ row }) => row.original.loadKg == null ? "—"
                : t("pages.routes.load", { load: row.original.loadKg.toLocaleString(), capacity: row.original.truck?.capacityKg?.toLocaleString() ?? "—" }),
        },
        {
            header: t("pages.routes.columns.distance"),
            accessorKey: "distanceMeters",
            cell: ({ row }) => `${((row.original.distanceMeters ?? 0) / 1000).toFixed(1)} ${t("mapLegend.search.kilometers")} · ${routeDuration(row.original.durationSeconds ?? 0, t)}`,
        },
        {
            header: t("pages.routes.columns.status"),
            accessorKey: "status",
            cell: ({ row }) => <RouteStatusBadge status={row.original.status} />,
        },
        {
            header: t("pages.routes.columns.verified"),
            accessorKey: "confirmedCount",
            cell: ({ row }) => {
                const { confirmedCount, contradictedCount } = row.original
                if (!confirmedCount && !contradictedCount) return <span className="text-muted-foreground">—</span>
                return (
                    <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-green-600" title={t("pages.routes.confirmed")}><CircleCheck size={14} />{confirmedCount}</span>
                        {contradictedCount > 0 && <span className="flex items-center gap-1 text-red-600" title={t("pages.routes.contradicted")}><CircleX size={14} />{contradictedCount}</span>}
                    </span>
                )
            },
        },
    ]

    // Stable, so the table does not remount the button on every render.
    const PlanButton = useCallback(() => isAdmin
        ? <Button type="button" onClick={() => setIsPlanning(true)}><Plus data-icon="inline-start" />{t("pages.routes.newRoute")}</Button>
        : null, [isAdmin, t])

    return (
        <div className="flex flex-col gap-4 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
                <OrganizationSelect />
                <DatePicker value={day ?? serviceDay} onChange={setDay} label={t("pages.routes.day")} />
                {day && <Button type="button" variant="ghost" onClick={() => setDay(null)}>{t("pages.routes.today")}</Button>}
            </div>
            <DataTable columns={columns} data={routes ?? []} isLoading={isLoadingRoutes} error={routesError}
                title={t("pages.routes.title")} ActionButton={PlanButton} />
            <Dialog open={isPlanning} onOpenChange={setIsPlanning}>
                <DialogContent side={side} className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                    <DialogHeader isRight={isRight}><DialogTitle>{t("mapLegend.route.title")}</DialogTitle></DialogHeader>
                    <RoutePlanForm onPlanned={(route) => { setIsPlanning(false); navigate(`/routes/${route._id}`) }} />
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default RoutesList
