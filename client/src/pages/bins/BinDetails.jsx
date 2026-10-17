import DataTable from "@/components/DataTable"
import EmptyCard from "@/components/EmptyCard"
import BinDeviceDetails from "@/components/bins/BinDeviceDetails"
import BinMaintenanceDetails from "@/components/bins/BinMaintenanceDetails"
import BinActions from "@/components/bins/details/BinActions"
import BinHeader from "@/components/bins/details/BinHeader"
import BinStatTiles from "@/components/bins/details/BinStatTiles"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import Battery from "../../components/bins/Battary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import HealthBadge from "@/components/bins/HealthBadge"
import { format } from "date-fns"
import { getVariant, isGateway } from "@/utils/binHelpers"
import { useBin } from "@/hooks/bins/useBin"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { LinkIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useTranslation } from "react-i18next"
import DeviceInstructions from "@/components/bins/DeviceInstructions"
import { useMe } from "@/hooks/users/auth/useMe"
import { useIsMobile } from "@/hooks/use-mobile"

function BinDetails() {
    const { isRight } = useAppSide()
    const { t } = useTranslation()
    const { id } = useParams()

    const { bin, isLoadingBins, binsError } = useBin(id)
    const { me, isAdmin } = useMe()
    const isUser = me?.role === 'user'
    const isMobile = useIsMobile()
    const gateway = isGateway(bin)

    const logsColumns = [
        {
            header: t("pages.binDetails.logsTable.columns.createdAt"),
            accessorKey: 'createdAt',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
        },
        {
            header: t("pages.binDetails.logsTable.columns.severity"),
            accessorKey: 'severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}>
                        {t(`severities.${severity}`)}
                    </Badge>
                );
            }
        },
        {
            header: t("pages.binDetails.logsTable.columns.type"),
            accessorKey: 'type',
            cell: ({ row }) => {
                const type = row.original.type;
                return (
                    t(`types.${type}`)
                );
            }
        },

        {
            header: t("pages.binDetails.logsTable.columns.fillLevel"),
            accessorKey: 'newLevel',
            cell: ({ row }) => row.original.newLevel == null
                ? t("sensorUnavailable")
                : `${row.original.newLevel}%`,
        },
        {
            header: t("components.logCard.weight"),
            accessorKey: 'weight',
            cell: ({ row }) => {
                return row.original.weight ?? '-'
            }
        },
        {
            header: t("pages.binDetails.logsTable.columns.healthStatus"),
            accessorKey: 'health',
            cell: ({ row }) => {
                return (
                    <HealthBadge
                        health={row.original.health}
                        message={row.original.message}
                    />
                );
            },
        },

        {
            header: t("pages.binDetails.logsTable.columns.batteryLevel"),
            accessorKey: 'battery',
            cell: ({ row }) => {
                return <Battery level={row.original.battery} />
            }
        },
        {
            header: t("pages.binDetails.logsTable.columns.source"),
            accessorKey: 'source',
            cell: ({ row }) => {
                const source = row.original.source;
                return (
                    t(`sources.${source}`)
                );
            }
        },
        {
            header: t("pages.binDetails.logsTable.columns.viewLog"),
            accessorKey: '_id',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/logs/${id}`}
                    >
                        <LinkIcon size={14} /> <span>{t("pages.binDetails.logsTable.columns.viewLog")}</span>
                    </Link>
                );
            },
        }

    ].filter(column => !gateway || !['newLevel', 'weight'].includes(column.accessorKey))

    // The bins whose last report this device relayed over the mesh.
    const connectedColumns = [
        {
            header: t("pages.binDetails.connectedTable.name"),
            accessorKey: 'binName',
            cell: ({ row }) => (
                <Link className="text-primary underline-offset-4 hover:underline" to={`/bins/${row.original._id}`}>
                    {row.original.binName}
                </Link>
            ),
        },
        {
            header: t("pages.binDetails.tiles.lastReport"),
            id: 'lastReport',
            accessorFn: (leaf) => leaf.status?.updatedAt ?? '',
            cell: ({ row }) => row.original.status?.updatedAt
                ? <span dir="ltr" className="whitespace-nowrap">{format(new Date(row.original.status.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                : '-',
        },
        {
            header: t("pages.binDetails.connectedTable.signal"),
            id: 'rssi',
            accessorFn: (leaf) => leaf.status?.connection?.rssi ?? null,
            cell: ({ row }) => row.original.status?.connection?.rssi != null
                ? <span dir="ltr">{row.original.status.connection.rssi} dBm</span>
                : '-',
        },
        {
            header: t("components.binCard.hops"),
            id: 'hops',
            accessorFn: (leaf) => leaf.status?.connection?.hops ?? null,
            cell: ({ row }) => row.original.status?.connection?.hops ?? '-',
        },
    ]

    const chartConfig = {
        battery: {
            label: t("pages.binDetails.areaChart.battery"),
            color: 'var(--chart-1)'
        },
        ...(gateway ? {} : {
            newLevel: {
                label: t("pages.binDetails.areaChart.level"),
                color: "var(--chart-2)",
            }
        })
    }
    const [timeRange, setTimeRange] = useState("90d")
    // The tab lives in the URL (?tab=…), so a refresh or a shared link opens the
    // same section; replace keeps tab changes out of the back history.
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = searchParams.get("tab") ?? "logs"
    const setTab = useCallback((value) => {
        setSearchParams((params) => {
            const next = new URLSearchParams(params)
            if (value === "logs") next.delete("tab")
            else next.set("tab", value)
            return next
        }, { replace: true })
    }, [setSearchParams])
    const connectedCount = bin?.connectedLeaves?.length ?? 0
    // What the device reports first, then what can be done to it. Connected
    // bins are for gateways and bins that relay; remote commands for admins;
    // managing for everyone but regular users.
    const tabs = useMemo(() => [
        "logs",
        "details",
        ...(gateway || connectedCount > 0 ? ["connected"] : []),
        ...(isAdmin ? ["instructions"] : []),
        ...(isUser ? [] : ["actions"]),
    ], [isAdmin, isUser, gateway, connectedCount])
    // Opening another device from its links keeps this page mounted; fall back
    // to the logs if the chosen tab does not exist for it.
    const activeTab = tabs.includes(tab) ? tab : "logs"

    // The tabs and the carousel of sections follow each other: choosing a tab
    // slides to its section, and swiping (on phones) chooses the tab.
    const [carouselApi, setCarouselApi] = useState(null)
    useEffect(() => {
        if (!carouselApi) return
        const onSelect = () => setTab(tabs[carouselApi.selectedScrollSnap()])
        carouselApi.on("select", onSelect)
        return () => {
            carouselApi.off("select", onSelect)
        }
    }, [carouselApi, tabs, setTab])
    // The first move (the tab from the URL after a refresh) jumps without sliding.
    const hasPositionedRef = useRef(false)
    useEffect(() => {
        const index = tabs.indexOf(activeTab)
        if (carouselApi && carouselApi.selectedScrollSnap() !== index) {
            carouselApi.scrollTo(index, !hasPositionedRef.current)
        }
        if (carouselApi) hasPositionedRef.current = true
    }, [carouselApi, tabs, activeTab])
    const filteredData = bin?.logs.filter((item) => {
        const date = new Date(item.createdAt)
        const referenceDate = new Date()
        let daysToSubtract = 90
        if (timeRange === "30d") {
            daysToSubtract = 30
        } else if (timeRange === "7d") {
            daysToSubtract = 7
        }
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
    })


    return (
        // A one-column grid (minmax(0, 1fr)): the wide logs table and the tab row
        // scroll inside the page instead of widening it.
        <div className="grid grid-cols-1 gap-4">
            {isLoadingBins ? (
                <Card>
                    <CardContent className="flex justify-center py-10">
                        <Spinner className="size-12" />
                    </CardContent>
                </Card>
            ) : !bin ? (
                <Card>
                    <EmptyCard title={t("components.binCard.emptyCard")} description={t("components.binCard.emptyDescription")} />
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <BinHeader bin={bin} className="col-span-2 lg:col-span-1" />
                    <BinStatTiles bin={bin} />
                </div>
            )}
            <Card>
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>{t("pages.binDetails.areaChart.title")}</CardTitle>
                        <CardDescription>
                            {t("pages.binDetails.areaChart.description")}
                        </CardDescription>
                    </div>
                    <Select isRight={isRight} value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger isRight={isRight}
                            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                            aria-label="Select a value"
                        >
                            <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem isRight={isRight} value="90d" className="rounded-lg">
                                {t("pages.binDetails.areaChart.lastDays", { count: 90 })}
                            </SelectItem>
                            <SelectItem isRight={isRight} value="30d" className="rounded-lg">
                                {t("pages.binDetails.areaChart.lastDays", { count: 30 })}
                            </SelectItem>
                            <SelectItem isRight={isRight} value="7d" className="rounded-lg">
                                {t("pages.binDetails.areaChart.lastDays", { count: 7 })}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[300px] w-full"
                    >
                        <AreaChart
                            data={filteredData}>
                            <defs>
                                <linearGradient id="fillLevel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillBattery" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />

                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="createdAt"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                reversed={!isRight}
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString(isRight ? "en-US" : "he-IL", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => {
                                            return new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area
                                dataKey="battery"
                                type="natural"
                                fill="url(#fillBattery)"
                                stroke="var(--chart-2)"
                                stackId='a'
                            />
                            {!gateway && <Area
                                dataKey="newLevel"
                                type="natural"
                                fill="url(#fillLevel)"
                                stroke="var(--chart-1)"
                                stackId='a'

                            />}
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {bin && (
                <div className="flex flex-col gap-4">
                    <div className="overflow-x-auto">
                        {/* The page's direction already orders the tabs; isRight only keeps the
                            component from reversing them, and dir sets the arrow keys. */}
                        <ToggleGroup
                            type="single"
                            isRight
                            dir={isRight ? "ltr" : "rtl"}
                            value={activeTab}
                            onValueChange={(value) => value && setTab(value)}
                            className="w-fit justify-start rounded-lg border p-1"
                            aria-label={t("pages.binDetails.tabs.label")}
                        >
                            {tabs.map((name) => (
                                <ToggleGroupItem key={name} value={name} className="px-3">
                                    {t(`pages.binDetails.tabs.${name}`)}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    {/* Swiping only on phones, so dragging never fights text selection on a
                        desktop. The carousel's own arrow keys are off: they would also catch
                        the arrows in the search box and inputs inside the sections. isRight
                        keeps the content from being reversed; the direction comes from dir.
                        The default gutter between slides stays: without it the next section
                        shows in the carousel's 4px edge. */}
                    <Carousel
                        setApi={setCarouselApi}
                        allowDrag={isMobile}
                        opts={{ direction: isRight ? "ltr" : "rtl" }}
                        dir={isRight ? "ltr" : "rtl"}
                        onKeyDownCapture={() => { }}
                    >
                        <CarouselContent isRight className="items-start">
                            {tabs.map((name) => (
                                <CarouselItem key={name} inert={name !== activeTab}>
                                    {name === "logs" && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("pages.binDetails.logsTable.title")}</CardTitle>
                                                <CardDescription>{t("pages.binDetails.logsTable.description")}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <DataTable columns={logsColumns} isLoading={isLoadingBins} data={bin.logs ?? []} maxLength={6} error={binsError} sortingBy={[{ id: 'createdAt', desc: true }]} />
                                            </CardContent>
                                        </Card>
                                    )}
                                    {name === "instructions" && <DeviceInstructions key={bin._id} bin={bin} />}
                                    {name === "details" && (
                                        <div className="grid gap-4 lg:grid-cols-2">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{t("pages.binDetails.deviceTitle")}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex flex-col gap-3 text-sm">
                                                    <BinDeviceDetails bin={bin} />
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{t("components.binCard.maintenance.title")}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex flex-col gap-2.5 text-sm">
                                                    {bin.maintenance
                                                        ? <BinMaintenanceDetails maintenance={bin.maintenance} />
                                                        : <p className="text-muted-foreground">{t("components.binCard.maintenance.notServedYet")}</p>}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                    {name === "connected" && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>{t("components.binCard.connectedLeaves")}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {connectedCount > 0
                                                    ? <DataTable columns={connectedColumns} isLoading={false} data={bin.connectedLeaves} maxLength={6} sortingBy={[{ id: 'lastReport', desc: true }]} />
                                                    : <p className="text-sm text-muted-foreground">{t("components.binCard.noConnectedLeaves")}</p>}
                                            </CardContent>
                                        </Card>
                                    )}
                                    {name === "actions" && <BinActions key={bin._id} bin={bin} />}
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            )}
        </div>

    )
}

export default BinDetails
