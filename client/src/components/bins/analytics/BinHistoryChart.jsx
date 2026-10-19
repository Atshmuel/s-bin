import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CartesianGrid, ComposedChart, Area, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useBinAnalytics } from "@/hooks/analytics/useBinAnalytics"
import { isGateway } from "@/utils/binHelpers"
import { formatDate } from "@/utils/helpers"
import RangeSelect from "./RangeSelect"

// Level, weight and battery per report, with a dashed line where the bin was
// emptied. Level and battery share the % axis; weight has its own kg axis.
function BinHistoryChart({ bin, enabled = true, className }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const [range, setRange] = useState(30)
    const { data, isLoading, error } = useBinAnalytics(bin._id, "history", { range, enabled })
    const gateway = isGateway(bin)

    const points = (data?.points ?? []).map((point) => ({ ...point, at: new Date(point.at).getTime() }))
    const showWeight = !gateway && points.some((point) => point.weight !== null)
    const collections = (data?.collections ?? []).map((at) => new Date(at).getTime())

    const chartConfig = {
        battery: { label: t("pages.binDetails.areaChart.battery"), color: "var(--chart-2)" },
        ...(gateway ? {} : { level: { label: t("pages.binDetails.areaChart.level"), color: "var(--chart-1)" } }),
        ...(showWeight ? { weight: { label: t("pages.binDetails.areaChart.weight"), color: "var(--chart-3)" } } : {}),
    }
    const formatTime = (value) => formatDate(value, isRight, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-start gap-2 space-y-0">
                <div className="grid flex-1 gap-1">
                    <CardTitle>{t("pages.binDetails.areaChart.title")}</CardTitle>
                    <CardDescription>{t("pages.binDetails.areaChart.description")}</CardDescription>
                </div>
                <RangeSelect value={range} onChange={setRange} className="w-[140px]" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[220px] items-center justify-center"><Spinner className="size-8" /></div>
                ) : error ? (
                    <p role="alert" className="flex h-[220px] items-center justify-center text-sm text-destructive">{error.message}</p>
                ) : points.length === 0 ? (
                    <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                        {t("pages.binDetails.analytics.noReports")}
                    </p>
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
                        <ComposedChart data={points}>
                            <defs>
                                <linearGradient id="fillLevel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-level)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-level)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillBattery" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-battery)" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="var(--color-battery)" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="at"
                                type="number"
                                scale="time"
                                domain={["dataMin", "dataMax"]}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                reversed={!isRight}
                                tickFormatter={(value) => formatDate(value, isRight, { month: "short", day: "numeric" })}
                            />
                            <YAxis yAxisId="percent" domain={[0, 100]} hide />
                            {showWeight && (
                                <YAxis
                                    yAxisId="kg"
                                    orientation={isRight ? "right" : "left"}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    unit=" kg"
                                />
                            )}
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(_, payload) => formatTime(payload?.[0]?.payload?.at)}
                                        indicator="dot"
                                    />
                                }
                            />
                            {collections.map((at) => (
                                <ReferenceLine key={at} yAxisId="percent" x={at} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                            ))}
                            <Area yAxisId="percent" dataKey="battery" type="monotone" fill="url(#fillBattery)" stroke="var(--color-battery)" />
                            {!gateway && (
                                <Area yAxisId="percent" dataKey="level" type="monotone" fill="url(#fillLevel)" stroke="var(--color-level)" connectNulls />
                            )}
                            {showWeight && (
                                <Line yAxisId="kg" dataKey="weight" type="monotone" stroke="var(--color-weight)" dot={false} strokeWidth={2} connectNulls />
                            )}
                            <ChartLegend content={<ChartLegendContent />} />
                        </ComposedChart>
                    </ChartContainer>
                )}
                {collections.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {t("pages.binDetails.areaChart.collectionsNote", { count: collections.length })}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

export default BinHistoryChart
