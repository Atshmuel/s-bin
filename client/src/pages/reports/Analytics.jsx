import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLogs } from "@/hooks/bins/binLogs/useBinLogs"
import { useBinStatusOV } from "@/hooks/overviews/useBinStatusOV"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, Label, Pie, PieChart, XAxis } from "recharts"



const statusChartConfig = {
    bins: {
        label: "Bins",
    },
    good: {
        label: "Good",
        color: "var(--color-chart-2)",
    },
    warning: {
        label: "Warning",
        color: "var(--color-chart-3)",
    },
    critical: {
        label: "Critical",
        color: "var(--color-chart-1)",
    }
}

const areaChartConfig = {
    battery: {
        label: 'Battery',
        color: 'var(--chart-1)'
    },
    newLevel: {
        label: "Level",
        color: "var(--chart-2)",
    }
}



function Analytics() {
    const [timeRange, setTimeRange] = useState("90d")
    const { allLogs, isLoadingLogs, logsError } = useLogs()
    const { binsCount, isLoadingStatusOV, statusOVError } = useBinStatusOV()

    if (isLoadingLogs || isLoadingStatusOV) return null

    const filteredLogs = allLogs.filter((item) => {
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

    const binsChartData = binsCount.byStatus.map((b, i) => {
        return { ...b, fill: `var(--color-chart-${i + 1})` }
    })


    return (
        <div>
            <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0 ">
                <Card className='lg:w-11/12'>
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
                            config={areaChartConfig}
                            className="aspect-auto h-[250px] w-full"
                        >
                            <AreaChart data={filteredLogs}>
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
                <Card className="flex flex-col lg:1/12">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Fleet Health Overview</CardTitle>
                        <CardDescription>Real-time bin status distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={statusChartConfig}
                            className="mx-auto lg:aspect-square min-h-[250px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={binsChartData}
                                    dataKey="count"
                                    nameKey="status"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {binsCount.total.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Bins
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        <div className="text-muted-foreground leading-none">
                            Real-time bins status
                        </div>
                    </CardFooter>
                </Card>
            </div>

        </div>
    )
}

export default Analytics





