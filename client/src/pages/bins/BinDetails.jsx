import BinCard from "@/components/bins/BinCard"
import DataTable from "@/components/DataTable"
import Battery from "../../components/bins/Battary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getVariant } from "@/utils/binHelpers"
import { useBin } from "@/hooks/bins/useBin"
import { Link, useParams } from "react-router-dom"
import { LinkIcon } from "lucide-react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useTranslation } from "react-i18next"

function BinDetails() {
    const { isRight } = useAppSide()
    const { t } = useTranslation()
    const { id } = useParams()

    const { bin, isLoadingBins, binsError } = useBin(id)

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
                const health = row.original.health;
                return (
                    <Badge variant={getVariant(health)} >
                        {t(`levels.${health}`)}
                    </Badge>
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

    ]

    const chartConfig = {
        battery: {
            label: t("pages.binDetails.areaChart.battery"),
            color: 'var(--chart-1)'
        },
        newLevel: {
            label: t("pages.binDetails.areaChart.level"),
            color: "var(--chart-2)",
        }
    }
    const [timeRange, setTimeRange] = useState("90d")
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
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                <BinCard className='flex-1 min-w-xs flex-col justify-between' bin={bin} isLoading={isLoadingBins} />
                <Card className='flex-2  min-w-xs md:min-w-md'>
                    <CardHeader>
                        <h3 className="text-xl md:text-2xl"></h3>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {t("pages.binDetails.logsTable.title")}
                        </CardTitle>
                        <CardDescription>{t("pages.binDetails.logsTable.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={logsColumns} isLoading={isLoadingBins} data={bin?.logs ?? []} maxLength={4} error={binsError} sortingBy={[{ id: 'createdAt', desc: true }]} />
                    </CardContent>
                </Card>

            </div>
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
                            <Area
                                dataKey="newLevel"
                                type="natural"
                                fill="url(#fillLevel)"
                                stroke="var(--chart-1)"
                                stackId='a'

                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

    )
}

export default BinDetails
