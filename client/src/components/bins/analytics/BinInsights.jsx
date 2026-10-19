import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useBinAnalytics } from "@/hooks/analytics/useBinAnalytics"
import { isGateway } from "@/utils/binHelpers"
import { formatDate } from "@/utils/helpers"
import BinHistoryChart from "./BinHistoryChart"
import RangeSelect from "@/components/analytics/RangeSelect"
import SectionCard, { Muted } from "@/components/analytics/SectionCard"

function CollectionsCard({ bin, enabled }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const [range, setRange] = useState(90)
    const { data, isLoading, error } = useBinAnalytics(bin._id, "collections", { range, enabled })
    const collections = data?.collections ?? []

    return (
        <SectionCard
            title={t("pages.binDetails.analytics.collections.title")}
            description={t("pages.binDetails.analytics.collections.description")}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading}
            error={error}
        >
            {collections.length === 0 ? (
                <Muted>{t("pages.binDetails.analytics.collections.none")}</Muted>
            ) : (
                <ul className="flex max-h-64 flex-col divide-y overflow-y-auto">
                    {collections.map((collection) => (
                        <li key={collection.at} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span dir="ltr">{formatDate(collection.at, isRight, { dateStyle: "medium", timeStyle: "short" })}</span>
                            <span className="text-muted-foreground">
                                {collection.fullnessBefore !== null &&
                                    t("pages.binDetails.analytics.collections.fullnessBefore", { percent: collection.fullnessBefore })}
                                {collection.kgRemoved !== null &&
                                    <> · {t("pages.binDetails.analytics.collections.kgRemoved", { kg: collection.kgRemoved.toFixed(1) })}</>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </SectionCard>
    )
}

function BatteryCard({ bin, enabled }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const [range, setRange] = useState(30)
    const { data, isLoading, error } = useBinAnalytics(bin._id, "battery", { range, enabled })
    const daily = data?.daily ?? []
    const chartConfig = {
        battery: { label: t("pages.binDetails.areaChart.battery"), color: "var(--chart-2)" },
        awakeSeconds: { label: t("pages.binDetails.analytics.battery.awake"), color: "var(--chart-4)" },
    }

    let outlook = t("pages.binDetails.analytics.battery.notEnoughData")
    if (data?.daysLeft != null) {
        outlook = t("pages.binDetails.analytics.battery.daysLeft", { count: Math.round(data.daysLeft) })
    } else if (data?.ratePerDay != null) {
        outlook = t("pages.binDetails.analytics.battery.notDraining")
    }

    return (
        <SectionCard
            title={t("pages.binDetails.analytics.battery.title")}
            description={outlook}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading}
            error={error}
        >
            {daily.length === 0 ? (
                <Muted>{t("pages.binDetails.analytics.noReports")}</Muted>
            ) : (
                <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
                    <LineChart data={daily}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                            reversed={!isRight}
                            tickFormatter={(day) => formatDate(`${day}T12:00:00`, isRight, { month: "short", day: "numeric" })}
                        />
                        <YAxis yAxisId="percent" domain={[0, 100]} hide />
                        <YAxis yAxisId="seconds" hide />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" labelFormatter={(_, payload) =>
                            formatDate(`${payload?.[0]?.payload?.day}T12:00:00`, isRight, { dateStyle: "medium" })} />}
                        />
                        <Line yAxisId="percent" dataKey="battery" type="monotone" stroke="var(--color-battery)" strokeWidth={2} dot={false} />
                        <Line yAxisId="seconds" dataKey="awakeSeconds" type="monotone" stroke="var(--color-awakeSeconds)" strokeDasharray="4 4" dot={false} connectNulls />
                    </LineChart>
                </ChartContainer>
            )}
        </SectionCard>
    )
}

function ReliabilityCard({ bin, enabled }) {
    const { t } = useTranslation()
    const { data, isLoading, error } = useBinAnalytics(bin._id, "reliability", { enabled })

    return (
        <SectionCard
            title={t("pages.binDetails.analytics.reliability.title")}
            description={t("pages.binDetails.analytics.reliability.description")}
            isLoading={isLoading}
            error={error}
        >
            <div className="grid grid-cols-2 gap-4">
                {[7, 30].map((days) => {
                    const period = data?.[`days${days}`]
                    return (
                        <div key={days} className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">{t("pages.binDetails.areaChart.lastDays", { count: days })}</span>
                            <span className="text-2xl font-semibold tabular-nums">
                                {period?.percent != null ? `${period.percent}%` : "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {period?.percent != null
                                    ? t("pages.binDetails.analytics.reliability.counts", { received: period.received, expected: period.expected })
                                    : t("pages.binDetails.analytics.reliability.notEnoughData")}
                            </span>
                        </div>
                    )
                })}
            </div>
        </SectionCard>
    )
}

function ConnectionCard({ bin, enabled }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const [range, setRange] = useState(30)
    const { data, isLoading, error } = useBinAnalytics(bin._id, "connection", { range, enabled })
    const points = (data?.points ?? [])
        .filter((point) => point.rssi !== null)
        .map((point) => ({ ...point, at: new Date(point.at).getTime() }))
    const chartConfig = {
        rssi: { label: t("pages.binDetails.connectedTable.signal"), color: "var(--chart-1)" },
        hops: { label: t("components.binCard.hops"), color: "var(--chart-3)" },
    }

    return (
        <SectionCard
            title={t("pages.binDetails.analytics.connection.title")}
            description={t("pages.binDetails.analytics.connection.description")}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading}
            error={error}
        >
            {points.length === 0 ? (
                <Muted>{t("pages.binDetails.analytics.noReports")}</Muted>
            ) : (
                <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
                    <LineChart data={points}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="at"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                            reversed={!isRight}
                            tickFormatter={(value) => formatDate(value, isRight, { month: "short", day: "numeric" })}
                        />
                        <YAxis yAxisId="rssi" domain={[-100, -20]} unit=" dBm" width={64} tickLine={false} axisLine={false}
                            orientation={isRight ? "left" : "right"} />
                        <YAxis yAxisId="hops" hide domain={[0, 8]} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" labelFormatter={(_, payload) =>
                            formatDate(payload?.[0]?.payload?.at, isRight, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />}
                        />
                        <Line yAxisId="rssi" dataKey="rssi" type="monotone" stroke="var(--color-rssi)" strokeWidth={2} dot={false} />
                        <Line yAxisId="hops" dataKey="hops" type="stepAfter" stroke="var(--color-hops)" strokeDasharray="4 4" dot={false} />
                    </LineChart>
                </ChartContainer>
            )}
        </SectionCard>
    )
}

// The bin page's analytics tab. Each card makes its own request, and only
// once the tab is opened (`active`), so the page itself stays light.
function BinInsights({ bin, active }) {
    const gateway = isGateway(bin)
    const viaMesh = bin.status?.connection?.via === "mesh"
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* The two charts side by side, then the emptyings and the reports. */}
            <BinHistoryChart bin={bin} enabled={active} />
            <BatteryCard bin={bin} enabled={active} />
            {!gateway && <CollectionsCard bin={bin} enabled={active} />}
            <ReliabilityCard bin={bin} enabled={active} />
            {viaMesh && <ConnectionCard bin={bin} enabled={active} />}
        </div>
    )
}

export default BinInsights
