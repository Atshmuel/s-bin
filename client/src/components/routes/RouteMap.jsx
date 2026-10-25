import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import polyline from "@mapbox/polyline";
import MapComponent from "@/components/map/MapComponent";
import MapKeyPanel from "@/components/map/controls/MapKeyPanel";
import RouteKey from "@/components/routes/RouteKey";
import { getColor } from "@/utils/binHelpers";
import { toLatLng } from "@/utils/geo";
import { ROUTE_COLOR, createRouteEndIcon, createStopIcon } from "@/utils/mapClusters";

// A stored route's line, where it starts and ends, and its stops numbered in
// driving order (a done stop greyed with a check).
export function RouteLayers({ route }) {
    const { t } = useTranslation()
    const sameEnd = route.end && route.end[0] === route.start[0] && route.end[1] === route.start[1]
    return (
        <>
            {route.geometry && (
                <Polyline positions={polyline.decode(route.geometry)} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.7, lineJoin: "round" }} />
            )}
            {route.stops.map(stop => (
                <Marker key={stop.binId} position={toLatLng(stop.location)}
                    icon={createStopIcon(stop.order, getColor(stop.fullnessAtPlan ?? 0), stop.status === "done")}>
                    <Tooltip direction="top" offset={[0, -14]}>
                        {t("mapLegend.route.stopTooltip", { order: stop.order, count: route.stops.length, name: stop.binName })}
                    </Tooltip>
                    <Popup>
                        <div className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold">{stop.order}. {stop.binName}</span>
                            <span>{t("mapLegend.route.stopFullness", { percent: Math.round(stop.fullnessAtPlan ?? 0) })}</span>
                            {stop.loadKg != null && <span>{t("mapLegend.route.stopLoad", { kg: stop.loadKg.toLocaleString() })}</span>}
                            <Link to={`/bins/${stop.binId}`}>{t("viewBin")}</Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
            <Marker position={toLatLng(route.start)} icon={createRouteEndIcon(t(sameEnd ? "mapLegend.route.startEnd" : "mapLegend.route.start"))} zIndexOffset={1000} />
            {route.end && !sameEnd && <Marker position={toLatLng(route.end)} icon={createRouteEndIcon(t("mapLegend.route.end"))} zIndexOffset={1000} />}
        </>
    )
}

// The route on a map of its own, opened around the whole route, with the
// route's own key (not the devices' one). `children` go inside the map (the
// driver's position while driving).
function RouteMap({ route, children }) {
    const bounds = [route.start, ...(route.end ? [route.end] : []), ...route.stops.map(stop => stop.location)].map(toLatLng)
    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border shadow-md">
            <MapComponent bounds={bounds}>
                <RouteLayers route={route} />
                <MapKeyPanel><RouteKey /></MapKeyPanel>
                {children}
            </MapComponent>
        </div>
    )
}

export default RouteMap
