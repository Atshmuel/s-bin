import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CircleAlert, Clock, InfoIcon, LinkIcon, WifiOff } from "lucide-react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import BinMap from "../bins/BinMap"
import DataTable from "@/components/DataTable"
import Battery from "@/components/bins/Battary"
import { getVariant, isGateway } from "@/utils/binHelpers"
import { useOverviewSection } from "@/hooks/analytics/useOverviewSection"

const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm"
// Reasons that call for a visit; the map shows only these bins.
const VISIT_REASONS = ["full", "maintenance", "offline"]
const REASON_VARIANTS = { full: "inactive", maintenance: "suspended", offline: "destructive", battery: "outline", health: "outline" }

// A count tile; each loads with its own request and waits on its own.
function Tile({ title, value, footer, icon, badgeVariant, isLoading, error }) {
    const Icon = icon
    return (
        <Card className="min-w-72 flex-1">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                    <CardDescription>{title}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                        {isLoading ? <Skeleton className="h-8 w-16" /> : error ? "-" : value}
                    </CardTitle>
                </div>
                <Badge variant={badgeVariant} className="p-1">
                    <Icon size={16} />
                </Badge>
            </CardHeader>
            <CardFooter className="text-sm">
                <span className="line-clamp-1 font-medium">{error ? error.message : footer}</span>
            </CardFooter>
        </Card>
    )
}

function TableCard({ title, description, children }) {
    return (
        <Card className="min-w-0 flex-1">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

function BinLink({ id, name }) {
    return <Link className="text-primary underline-offset-4 hover:underline" to={`/bins/${id}`}>{name ?? "-"}</Link>
}

function Dashboard() {
    const { t } = useTranslation()
    // The tiles, the map and the tables each make their own request, so the
    // page fills in as they arrive and a failure stays in its own card.
    const summary = useOverviewSection("summary")
    const offline = useOverviewSection("offline")
    const fullSoon = useOverviewSection("full-soon")
    const attention = useOverviewSection("attention")
    const recentLogs = useOverviewSection("recent-logs")

    const attentionDevices = attention.data?.devices ?? []
    const mapBins = attentionDevices.filter((device) => device.reasons.some((reason) => VISIT_REASONS.includes(reason)))

    const attentionColumns = [
        {
            header: t("pages.dashboard.tables.attention.columns.bin"),
            accessorKey: "binName",
            cell: ({ row }) => <BinLink id={row.original._id} name={row.original.binName} />,
        },
        {
            header: t("pages.dashboard.tables.attention.columns.reasons"),
            id: "reasons",
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.reasons.map((reason) => (
                        <Badge key={reason} variant={REASON_VARIANTS[reason]}>{t(`pages.dashboard.reasons.${reason}`)}</Badge>
                    ))}
                </div>
            ),
        },
        {
            header: t("pages.dashboard.tables.attention.columns.fullness"),
            accessorKey: "fullness",
            cell: ({ row }) => isGateway(row.original) || row.original.fullness === null ? "-" : `${row.original.fullness}%`,
        },
        {
            header: t("pages.dashboard.tables.attention.columns.battery"),
            id: "battery",
            cell: ({ row }) => <Battery level={row.original.status?.battery} />,
        },
        {
            header: t("pages.dashboard.tables.attention.columns.lastReport"),
            id: "lastReport",
            cell: ({ row }) => row.original.status?.updatedAt
                ? <span dir="ltr" className="whitespace-nowrap">{format(new Date(row.original.status.updatedAt), DATE_TIME_FORMAT)}</span>
                : "-",
        },
    ]

    const recentLogColumns = [
        {
            header: t("pages.dashboard.tables.recentLogs.columns.time"),
            accessorKey: "createdAt",
            cell: ({ row }) => <span dir="ltr" className="whitespace-nowrap">{format(new Date(row.original.createdAt), DATE_TIME_FORMAT)}</span>,
        },
        {
            header: t("pages.dashboard.tables.recentLogs.columns.bin"),
            accessorKey: "binName",
            cell: ({ row }) => <BinLink id={row.original.binId} name={row.original.binName} />,
        },
        {
            header: t("pages.dashboard.tables.recentLogs.columns.fillLevel"),
            accessorKey: "newLevel",
            cell: ({ row }) => row.original.newLevel == null ? "-" : `${row.original.newLevel}%`,
        },
        {
            header: t("pages.dashboard.tables.recentLogs.columns.severity"),
            accessorKey: "severity",
            cell: ({ row }) => <Badge variant={getVariant(row.original.severity)}>{t(`severities.${row.original.severity}`)}</Badge>,
        },
        {
            header: t("pages.dashboard.tables.recentLogs.columns.type"),
            accessorKey: "type",
            cell: ({ row }) => t(`types.${row.original.type}`),
        },
        {
            header: t("pages.dashboard.tables.recentLogs.columns.viewLog"),
            accessorKey: "_id",
            cell: ({ row }) => (
                <Link className="flex items-center gap-2" to={`/bins/logs/${row.original._id}`}>
                    <LinkIcon size={14} /> <span>{t("pages.dashboard.tables.recentLogs.columns.viewLog")}</span>
                </Link>
            ),
        },
    ]

    const tiles = [
        {
            title: t("pages.dashboard.cards.offline.title"),
            value: offline.data?.count,
            footer: t("pages.dashboard.cards.offline.description", { count: offline.data?.missedReports ?? 2 }),
            icon: WifiOff,
            badgeVariant: "destructive",
            isLoading: offline.isLoading,
            error: offline.error,
        },
        {
            title: t("pages.dashboard.cards.fullSoon.title"),
            value: fullSoon.data?.counts?.within24h,
            footer: t("pages.dashboard.cards.fullSoon.description", { count: fullSoon.data?.counts?.within48h ?? 0 }),
            icon: Clock,
            badgeVariant: "pending",
            isLoading: fullSoon.isLoading,
            error: fullSoon.error,
        },
        {
            title: t("pages.dashboard.cards.almostFull.title"),
            value: summary.data?.almostFull,
            footer: summary.data?.averageFullness != null
                ? t("pages.dashboard.cards.almostFull.average", { percent: summary.data.averageFullness })
                : t("pages.dashboard.cards.almostFull.description"),
            icon: InfoIcon,
            badgeVariant: "inactive",
            isLoading: summary.isLoading,
            error: summary.error,
        },
        {
            title: t("pages.dashboard.cards.requiredMaintenance.title"),
            value: summary.data?.requiringMaintenance,
            footer: t("pages.dashboard.cards.requiredMaintenance.description"),
            icon: CircleAlert,
            badgeVariant: "suspended",
            isLoading: summary.isLoading,
            error: summary.error,
        },
    ]

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl">{t("pages.dashboard.titles.quickOverview.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("pages.dashboard.titles.quickOverview.description")}</p>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex flex-wrap gap-4 lg:w-1/2">
                        {tiles.map((tile) => <Tile key={tile.title} {...tile} />)}
                    </div>
                    <div className="h-[250px] lg:h-auto lg:w-1/2">
                        {attention.isLoading
                            ? <Skeleton className="size-full min-h-[250px]" />
                            : <BinMap binsToUse={mapBins} zoom={13} legend={true} legendForm={false} />}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl">{t("pages.dashboard.titles.binOverview.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("pages.dashboard.titles.binOverview.description")}</p>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
                    <TableCard title={t("pages.dashboard.tables.attention.title")} description={t("pages.dashboard.tables.attention.description")}>
                        <DataTable data={attentionDevices} columns={attentionColumns} maxLength={5}
                            error={attention.error} isLoading={attention.isLoading} />
                    </TableCard>
                    <TableCard title={t("pages.dashboard.tables.recentLogs.title")} description={t("pages.dashboard.tables.recentLogs.description")}>
                        <DataTable data={recentLogs.data?.logs ?? []} columns={recentLogColumns} maxLength={5}
                            error={recentLogs.error} isLoading={recentLogs.isLoading} />
                    </TableCard>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
