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

function BinDetails() {

    const { id } = useParams()

    const { bin, isLoadingBins, binsError } = useBin(id)

    const logsColumns = [
        {
            header: 'created at',
            accessorKey: 'createdAt',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
        },
        {
            header: 'severity',
            accessorKey: 'severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}>
                        {severity}
                    </Badge>
                );
            }
        },
        {
            header: 'type',
            accessorKey: 'type',
        },

        {
            header: 'fill level',
            accessorKey: 'newLevel',
        },
        {
            header: 'health',
            accessorKey: 'health',
            cell: ({ row }) => {
                const health = row.original.health;
                return (
                    <Badge variant={getVariant(health)} >
                        {health}
                    </Badge>
                );
            },
        },

        {
            header: 'battery',
            accessorKey: 'battery',
            cell: ({ row }) => {
                return <Battery level={row.original.battery} />
            }
        },
        {
            header: 'source',
            accessorKey: 'source',
        },
        {
            header: 'View log',
            accessorKey: '_id',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/logs/${id}`}
                    >
                        <LinkIcon size={14} /> <span>View log</span>
                    </Link>
                );
            },
        }

    ]

    const chartConfig = {
        battery: {
            label: 'Battery',
            color: 'var(--chart-1)'
        },
        newLevel: {
            label: "Level",
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
                            Logs Overview
                        </CardTitle>
                        <CardDescription>Review detailed records of all bin activities, including fill levels, timestamps, and event types.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={logsColumns} isLoading={isLoadingBins} data={bin?.logs ?? []} maxLength={4} error={binsError} sortingBy={[{ id: 'createdAt', desc: true }]} />
                    </CardContent>
                </Card>

            </div>
            <Card>
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>Bin Status Over Time</CardTitle>
                        <CardDescription>
                            Battery level and fill percentage trends based on sensor logs.
                        </CardDescription>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                            aria-label="Select a value"
                        >
                            <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                Last 3 months
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                Last 7 days
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[300px] w-full"
                    >
                        <AreaChart data={filteredData}>
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
                                tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString("en-US", {
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
