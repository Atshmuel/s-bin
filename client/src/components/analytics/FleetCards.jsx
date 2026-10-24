import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { formatDistanceToNow } from "date-fns"
import { he } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useAppSide } from "@/hooks/useAppSide"
import { useOverviewSection } from "@/hooks/analytics/useOverviewSection"
import { useInView } from "@/hooks/use-in-view"
import { FULLNESS_CRITICAL_PERCENT } from "@/utils/constants"
import { formatDate } from "@/utils/helpers"
import RangeSelect from "./RangeSelect"
import SectionCard, { Muted } from "./SectionCard"

// The analytics page's sections. Each makes its own request, once it scrolls
// into view, so the page shows its first cards without waiting for the rest.

const CHART_CLASS = "aspect-auto h-[220px] w-full"

function useSection(section, range) {
    const [ref, inView] = useInView()
    return { ref, ...useOverviewSection(section, { range, enabled: inView }) }
}

function useDateFormats() {
    const { isRight } = useAppSide()
    // Days come as YYYY-MM-DD; noon keeps them on the same date in any zone.
    const dayLabel = (day, options = { month: "short", day: "numeric" }) =>
        day ? formatDate(`${day}T12:00:00`, isRight, options) : ""
    return { isRight, dayLabel }
}

function BinLink({ bin }) {
    return (
        <Link to={`/bins/${bin._id}`} className="truncate text-primary underline-offset-4 hover:underline">
            {bin.binName}
        </Link>
    )
}

function BigNumber({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-2xl font-semibold tabular-nums">{value}</span>
        </div>
    )
}

// A chart over the days of the range, one bar (or line) per day.
function DailyChart({ data, config, children }) {
    const { isRight, dayLabel } = useDateFormats()
    return (
        <ChartContainer config={config} className={CHART_CLASS}>
            <ComposedChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} reversed={!isRight}
                    tickFormatter={(day) => dayLabel(day)} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot"
                    labelFormatter={(_, payload) => dayLabel(payload?.[0]?.payload?.day, { dateStyle: "medium" })} />} />
                {children}
                <ChartLegend content={<ChartLegendContent />} />
            </ComposedChart>
        </ChartContainer>
    )
}

// Bins per range of a value (fullness or battery).
function BucketChart({ buckets, label }) {
    const { isRight } = useAppSide()
    const data = (buckets ?? []).map((bucket) => ({ name: `${bucket.from}–${bucket.to}%`, count: bucket.count }))
    return (
        <ChartContainer config={{ count: { label, color: "var(--chart-2)" } }} className={CHART_CLASS}>
            <BarChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} reversed={!isRight} />
                <YAxis allowDecimals={false} hide />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
    )
}

export function FullSoonCard() {
    const { t, i18n } = useTranslation()
    const { ref, data, isLoading, error } = useSection("full-soon")
    const locale = i18n.language === "he" ? he : undefined

    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.fullSoon.title")}
            description={t("pages.analytics.sections.fullSoon.description", { percent: FULLNESS_CRITICAL_PERCENT })}
            isLoading={isLoading} error={error}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <BigNumber label={t("pages.analytics.sections.fullSoon.within", { count: 24 })} value={data?.counts?.within24h ?? 0} />
                    <BigNumber label={t("pages.analytics.sections.fullSoon.within", { count: 48 })} value={data?.counts?.within48h ?? 0} />
                </div>
                {data?.bins?.length > 0 ? (
                    <ul className="flex max-h-48 flex-col divide-y overflow-y-auto">
                        {data.bins.map((bin) => (
                            <li key={bin._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <BinLink bin={bin} />
                                <span className="shrink-0 text-muted-foreground">
                                    {bin.fullness}% · {formatDistanceToNow(new Date(bin.collectionDueAt), { addSuffix: true, locale })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Muted>{t("pages.analytics.sections.fullSoon.none")}</Muted>
                )}
            </div>
        </SectionCard>
    )
}

export function FullnessDistributionCard() {
    const { t } = useTranslation()
    const { ref, data, isLoading, error } = useSection("fullness-distribution")
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.fullness.title")}
            description={t("pages.analytics.sections.fullness.description")} isLoading={isLoading} error={error}>
            <BucketChart buckets={data?.buckets} label={t("pages.analytics.sections.bins")} />
            {data?.unknown > 0 && <Muted>{t("pages.analytics.sections.fullness.unknown", { count: data.unknown })}</Muted>}
        </SectionCard>
    )
}

export function CollectionsTrendCard() {
    const { t } = useTranslation()
    const [range, setRange] = useState(30)
    const { ref, data, isLoading, error } = useSection("collections", range)
    const config = {
        count: { label: t("pages.analytics.sections.collections.count"), color: "var(--chart-2)" },
        avgFullnessBefore: { label: t("pages.analytics.sections.collections.fullness"), color: "var(--chart-1)" },
    }
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.collections.title")}
            description={data && data.total > 0
                ? t("pages.analytics.sections.collections.summary", { count: data.total, percent: data.avgFullnessBefore ?? "-" })
                : t("pages.analytics.sections.collections.description")}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading} error={error}>
            <DailyChart data={data?.daily} config={config}>
                <YAxis yAxisId="count" allowDecimals={false} hide />
                <YAxis yAxisId="percent" domain={[0, 100]} hide />
                <Bar yAxisId="count" dataKey="count" fill="var(--color-count)" radius={4} />
                <Line yAxisId="percent" dataKey="avgFullnessBefore" stroke="var(--color-avgFullnessBefore)" strokeWidth={2} connectNulls />
            </DailyChart>
        </SectionCard>
    )
}

export function WasteCard() {
    const { t } = useTranslation()
    const [range, setRange] = useState(30)
    const { ref, data, isLoading, error } = useSection("waste", range)
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.waste.title")}
            description={data?.weighedCollections > 0
                ? t("pages.analytics.sections.waste.summary", { kg: data.totalKg })
                : t("pages.analytics.sections.waste.description")}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading} error={error}>
            <DailyChart data={data?.daily} config={{ kg: { label: t("pages.analytics.sections.waste.kg"), color: "var(--chart-3)" } }}>
                <YAxis allowDecimals={false} hide />
                <Bar dataKey="kg" fill="var(--color-kg)" radius={4} />
            </DailyChart>
        </SectionCard>
    )
}

export function BatteryOutlookCard() {
    const { t } = useTranslation()
    const { ref, data, isLoading, error } = useSection("battery")
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.battery.title")}
            description={t("pages.analytics.sections.battery.description")} isLoading={isLoading} error={error}>
            <div className="flex flex-col gap-4">
                <BucketChart buckets={data?.buckets} label={t("pages.analytics.sections.devices")} />
                {data?.soon?.length > 0 ? (
                    <ul className="flex max-h-40 flex-col divide-y overflow-y-auto">
                        {data.soon.map((device) => (
                            <li key={device._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <BinLink bin={device} />
                                <span className="shrink-0 text-muted-foreground">
                                    {device.battery}% · {t("pages.analytics.sections.battery.daysLeft", { count: Math.round(device.daysLeft) })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Muted>{t("pages.analytics.sections.battery.none", { count: data?.soonDays ?? 30 })}</Muted>
                )}
            </div>
        </SectionCard>
    )
}

export function ConnectivityCard() {
    const { t } = useTranslation()
    const { ref, data, isLoading, error } = useSection("connectivity")
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.connectivity.title")}
            description={t("pages.analytics.sections.connectivity.description", { count: data?.reliabilityDays ?? 7 })}
            isLoading={isLoading} error={error}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                    <BigNumber label={t("pages.binDetails.tiles.cellular")} value={data?.share?.cellular ?? 0} />
                    <BigNumber label={t("pages.binDetails.tiles.mesh")} value={data?.share?.mesh ?? 0} />
                    <BigNumber label={t("pages.analytics.sections.connectivity.onTime")}
                        value={data?.averageReliability != null ? `${data.averageReliability}%` : "-"} />
                </div>
                {data?.gateways?.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                            {t("pages.analytics.sections.connectivity.gateways")} ({data.gatewayCount ?? data.gateways.length})
                        </span>
                        <ul className="flex max-h-40 flex-col divide-y overflow-y-auto">
                            {data.gateways.map((gateway) => (
                                <li key={gateway._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                    {gateway.binName ? <BinLink bin={gateway} /> : <span>-</span>}
                                    <span className="shrink-0 text-muted-foreground">
                                        {t("pages.analytics.sections.connectivity.leaves", { count: gateway.leaves })}
                                        {gateway.avgRssi != null && <> · <span dir="ltr">{gateway.avgRssi} dBm</span></>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data?.leastReliable?.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">{t("pages.analytics.sections.connectivity.leastReliable")}</span>
                        <ul className="flex max-h-40 flex-col divide-y overflow-y-auto">
                            {data.leastReliable.map((device) => (
                                <li key={device._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                    <BinLink bin={device} />
                                    <span className="shrink-0 text-muted-foreground">
                                        {device.percent}% · {t("pages.binDetails.analytics.reliability.counts", { received: device.received, expected: device.expected })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </SectionCard>
    )
}

const HEALTH_CAUSES = ["fillSensor", "battery", "scale", "gps"]

export function HealthCausesCard() {
    const { t } = useTranslation()
    const [range, setRange] = useState(30)
    const { ref, data, isLoading, error } = useSection("health-causes", range)
    const config = Object.fromEntries(HEALTH_CAUSES.map((cause, i) => [
        cause, { label: t(`pages.analytics.sections.healthCauses.${cause}`), color: `var(--chart-${i + 1})` },
    ]))
    return (
        <SectionCard ref={ref} title={t("pages.analytics.sections.healthCauses.title")}
            description={t("pages.analytics.sections.healthCauses.description")}
            action={<RangeSelect value={range} onChange={setRange} className="w-[140px]" />}
            isLoading={isLoading} error={error}>
            <DailyChart data={data?.daily} config={config}>
                <YAxis allowDecimals={false} hide />
                {HEALTH_CAUSES.map((cause) => (
                    <Bar key={cause} dataKey={cause} stackId="causes" fill={`var(--color-${cause})`} />
                ))}
            </DailyChart>
        </SectionCard>
    )
}
