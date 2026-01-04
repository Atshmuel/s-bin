import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useLogs } from "@/hooks/bins/binLogs/useBinLogs"
import { useBinStatusOV } from "@/hooks/overviews/useBinStatusOV"
import { useLogsTypeOV } from "@/hooks/overviews/useLogsTypeOV"
import { useState } from "react"
import AIInsights from "./AIInsights"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis } from "recharts"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useTranslation } from "react-i18next"

function Analytics() {
    const { t } = useTranslation()
    const pieChartConfig = {
        bins: {
            label: t("pages.analytics.pie.bins"),
        },
        good: {
            label: t("pages.analytics.pie.good"),
            color: "var(--color-chart-2)",
        },
        warning: {
            label: t("pages.analytics.pie.warning"),
            color: "var(--color-chart-3)",
        },
        critical: {
            label: t("pages.analytics.pie.critical"),
            color: "var(--color-chart-1)",
        }
    }
    const areaChartConfig = {
        battery: {
            label: t("pages.analytics.area.battery"),
            color: 'var(--chart-1)'
        },
        newLevel: {
            label: t("pages.analytics.area.level"),
            color: "var(--chart-2)",
        }
    }
    const barChartConfig = {
        maintenance: {
            label: t("pages.analytics.bar.maintenance"),
            color: "var(--color-chart-1)",
        },
        error: {
            label: t("pages.analytics.bar.error"),
            color: "var(--color-chart-2)",
        },
        log: {
            label: t("pages.analytics.bar.log"),
            color: "var(--color-chart-3)",
        },
    }


    const [timeRange, setTimeRange] = useState("90d")
    const { isRight } = useAppSide()

    const { allLogs, isLoadingLogs, logsError } = useLogs()
    const { binsCount, isLoadingStatusOV, statusOVError } = useBinStatusOV()
    const { logTypes, isLoadingLogTypeOV, logTypeOVError } = useLogsTypeOV()

    const filteredLogs = allLogs?.filter((item) => {
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
    }) || []

    const binsChartData = binsCount?.byStatus?.map((b, i) => {
        return { ...b, fill: `var(--color-chart-${i + 1})` }
    }) || []


    return (
        <div className="space-y-6">
            <AIInsights />
            <div className="flex flex-col xl:flex-row gap-6">
                <Card className="flex-3">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>{t("pages.analytics.binStatusOverTime.title")}</CardTitle>
                            < CardDescription >
                                {t("pages.analytics.binStatusOverTime.description")}
                            </CardDescription>
                        </div>
                        <Select disabled={isLoadingLogs || logsError} value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger
                                isRight={isRight}
                                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                                aria-label="Select a value"
                            >
                                <SelectValue placeholder={t(`pages.analytics.lastDays`, { count: 90 })} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem isRight={isRight} value="90d" className="rounded-lg">
                                    {t(`pages.analytics.lastDays`, { count: 90 })}
                                </SelectItem>
                                <SelectItem isRight={isRight} value="30d" className="rounded-lg">
                                    {t(`pages.analytics.lastDays`, { count: 30 })}
                                </SelectItem>
                                <SelectItem isRight={isRight} value="7d" className="rounded-lg">
                                    {t(`pages.analytics.lastDays`, { count: 7 })}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        {isLoadingLogs && !logsError ?
                            <div className="flex flex-col space-y-13 pt-6">
                                <Skeleton className="w-full h-1" />
                                <Skeleton className="w-full h-1" />
                                <Skeleton className="w-full h-1" />
                                <Skeleton className="w-full h-1" />
                            </div>
                            :
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
                                                    return new Date(value).toLocaleDateString(isRight ? "en-US" : "he-IL", {
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
                            </ChartContainer>}
                    </CardContent>
                </Card>
                <Card className="flex flex-col min-w-0 flex-1">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>{t("pages.analytics.fleetHealthOverview.title")}</CardTitle>
                        <CardDescription>{t("pages.analytics.fleetHealthOverview.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {isLoadingStatusOV && !statusOVError ? <Skeleton className="size-45 mx-auto rounded-full my-10" /> :
                            <ChartContainer
                                config={pieChartConfig}
                                className="mx-auto aspect-auto h-[250px]"
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
                                                                {t("bins")}
                                                            </tspan>
                                                        </text>
                                                    )
                                                }
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        }
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        <div className="text-muted-foreground leading-none">
                            {t("pages.analytics.fleetHealthOverview.footer", { count: binsCount?.total?.toLocaleString() || 0 })}
                        </div>
                    </CardFooter>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("pages.analytics.binsEventDistribution.title")}</CardTitle>
                        <CardDescription>{t("pages.analytics.binsEventDistribution.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                        {isLoadingLogTypeOV && !logTypeOVError ?
                            <div className="flex h-[250px] w-full items-end justify-between gap-2 px-2 pt-4">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="flex-1 min-w-[4px] max-w-[20px]"
                                        style={{
                                            height: `${Math.floor(Math.random() * 80) + 10}%`
                                        }}
                                    />
                                ))}
                            </div> :

                            <ChartContainer className="aspect-auto h-[250px]" config={barChartConfig}>
                                <BarChart accessibilityLayer data={logTypes}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        reversed={!isRight}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(isRight ? "en-US" : "he-IL", { day: '2-digit', month: 'short' })}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar
                                        dataKey="log"
                                        stackId="a"
                                        fill="var(--color-chart-1)"
                                        radius={[0, 0, 4, 4]}
                                    />
                                    <Bar
                                        dataKey="maintenance"
                                        stackId="a"
                                        fill="var(--color-chart-2)"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="error"
                                        stackId="a"
                                        fill="var(--color-chart-3)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        }
                    </CardContent>

                </Card>
            </div>

        </div>
    )
}

export default Analytics





