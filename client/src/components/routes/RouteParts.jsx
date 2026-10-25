import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSide } from "@/hooks/useAppSide"
import { useRouteDrivers, useUpdateRoute } from "@/hooks/routes/useRoutes"
import { useMe } from "@/hooks/users/auth/useMe"

const STATUS_VARIANTS = Object.freeze({ planned: "pending", driving: "active", finished: "outline", cancelled: "inactive" })
const UNASSIGNED = "none"

export function RouteStatusBadge({ status }) {
    const { t } = useTranslation()
    return <Badge variant={STATUS_VARIANTS[status] ?? "outline"}>{t(`pages.routes.statuses.${status}`)}</Badge>
}

// Who drives the route: a picker for owners and admins while the route is
// open, the name otherwise.
export function RouteDriverSelect({ route, className = "w-44" }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { isAdmin, isOwner } = useMe()
    const editable = isAdmin && ["planned", "driving"].includes(route.status)
    const { drivers, isLoadingDrivers } = useRouteDrivers(isOwner ? route.orgId : null, { enabled: editable })
    const mutation = useUpdateRoute()

    if (!editable) {
        return <span className={route.driverName ? "" : "text-muted-foreground"}>{route.driverName ?? t("pages.routes.noDriver")}</span>
    }
    if (isLoadingDrivers) return <Skeleton className={`h-9 ${className}`} />
    // A driver no longer active stays shown until replaced.
    const options = route.driverId && !drivers.some(driver => driver._id === route.driverId)
        ? [...drivers, { _id: route.driverId, name: route.driverName ?? t("pages.routes.unknownDriver") }]
        : drivers
    return (
        <Select value={route.driverId ?? UNASSIGNED} disabled={mutation.isPending}
            onValueChange={(value) => mutation.mutate({ id: route._id, driverId: value === UNASSIGNED ? null : value })}>
            <SelectTrigger isRight={isRight} className={className} aria-label={t("pages.routes.columns.driver")}><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1000]">
                <SelectItem isRight={isRight} value={UNASSIGNED}>{t("pages.routes.noDriver")}</SelectItem>
                {options.map(driver => <SelectItem isRight={isRight} key={driver._id} value={driver._id}>{driver.name}</SelectItem>)}
            </SelectContent>
        </Select>
    )
}
