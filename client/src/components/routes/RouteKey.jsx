import { useTranslation } from "react-i18next"
import { STATUS_COLORS } from "@/utils/binHelpers"
import { DEFAULT_THRESHOLDS } from "@/utils/constants"
import { ROUTE_COLOR } from "@/utils/mapClusters"

// A stop marker as the route map draws it (see createStopIcon), small.
function StopSample({ children, background = ROUTE_COLOR, dot, faded = false }) {
    return (
        <span className={`relative flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow ${faded ? "border-dashed opacity-55" : ""}`}
            style={{ background }}>
            {children}
            {dot && <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full border border-white" style={{ background: dot }} />}
        </span>
    )
}

// What a route map's line and markers mean (shown by MapKeyPanel), with the
// route's organization's cut-offs.
function RouteKey({ thresholds = DEFAULT_THRESHOLDS }) {
    const { t } = useTranslation()
    const { fullnessWarning: warning, fullnessCritical: critical } = thresholds
    const fullness = [
        [STATUS_COLORS.good, t("mapLegend.key.fullnessLow", { warning })],
        [STATUS_COLORS.warning, t("mapLegend.key.fullnessMid", { warning, belowCritical: critical - 1 })],
        [STATUS_COLORS.critical, t("mapLegend.key.fullnessHigh", { critical })],
    ]
    return (
        <section className="flex flex-col gap-2 text-xs">
            <h4 className="text-sm font-medium">{t("pages.routes.key.title")}</h4>
            <ul className="flex flex-col gap-1.5">
                <li className="flex items-center gap-2">
                    <span className="h-1.5 w-5 shrink-0 rounded-full" style={{ background: ROUTE_COLOR, opacity: 0.7 }} />
                    {t("pages.routes.key.line")}
                </li>
                <li className="flex items-center gap-2"><StopSample>3</StopSample>{t("pages.routes.key.stop")}</li>
                <li className="flex items-center gap-2"><StopSample background="#9ca3af">✓</StopSample>{t("pages.routes.key.done")}</li>
                <li className="flex items-center gap-2"><StopSample background="#9ca3af" faded>–</StopSample>{t("pages.routes.key.skipped")}</li>
                <li className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-[#0f172a] px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("mapLegend.route.start")}</span>
                    {t("pages.routes.key.depot")}
                </li>
            </ul>
            <p className="text-muted-foreground">{t("pages.routes.key.dot")}</p>
            <ul className="flex flex-col gap-1.5">
                {fullness.map(([color, text]) => (
                    <li key={color} className="flex items-center gap-2"><StopSample dot={color}>3</StopSample>{text}</li>
                ))}
            </ul>
        </section>
    )
}

export default RouteKey
