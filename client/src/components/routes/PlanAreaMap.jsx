import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import L from "leaflet"
import { Circle, CircleMarker, Marker, useMap, useMapEvents } from "react-leaflet"
import MapComponent from "@/components/map/MapComponent"
import { getColor } from "@/utils/binHelpers"
import { PLAN_MAP_MAX_ZOOM, PLAN_MAP_MIN_ZOOM, PLAN_MAP_WHEEL_DEBOUNCE_MS, PLAN_MAP_WHEEL_PX_PER_ZOOM_LEVEL } from "@/utils/constants"
import { toLatLng } from "@/utils/geo"
import { ROUTE_COLOR, createRouteEndIcon } from "@/utils/mapClusters"

// Fits the map to the area when its size changes (not when it moves: a click
// that moves it should not also zoom the map away).
function FitToArea({ center, radiusMeters }) {
    const map = useMap()
    // A map in a dialog is measured while the dialog still grows in: measure
    // again once it has opened.
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 250)
        return () => clearTimeout(timer)
    }, [map])
    useEffect(() => {
        map.fitBounds(L.latLng(toLatLng(center)).toBounds(radiusMeters * 2), { padding: [16, 16] })
    }, [map, radiusMeters]) // eslint-disable-line react-hooks/exhaustive-deps -- refits on the size only
    return null
}

// Pans to the area when its centre leaves the view ("Back to the depot" after
// the map was moved away); a click inside the view moves only the circle.
function KeepAreaInView({ center }) {
    const map = useMap()
    useEffect(() => {
        const latLng = L.latLng(toLatLng(center))
        if (!map.getBounds().contains(latLng)) map.panTo(latLng)
    }, [map, center])
    return null
}

function MoveOnClick({ onMove }) {
    useMapEvents({ click: (event) => onMove([event.latlng.lng, event.latlng.lat]) })
    return null
}

// Where a route will collect: the depot it starts and ends at, the area (a
// click moves it) and the bins in it that a route could take, by fullness.
function PlanAreaMap({ depot, center, radiusMeters, bins, thresholds, onMove }) {
    const { t } = useTranslation()
    return (
        <div className="relative h-full min-h-80 w-full overflow-hidden rounded-xl border">
            <MapComponent center={toLatLng(center)} zoom={13} preferCanvas minZoom={PLAN_MAP_MIN_ZOOM} maxZoom={PLAN_MAP_MAX_ZOOM}
                wheelPxPerZoomLevel={PLAN_MAP_WHEEL_PX_PER_ZOOM_LEVEL} wheelDebounceTime={PLAN_MAP_WHEEL_DEBOUNCE_MS}>
                <FitToArea center={center} radiusMeters={radiusMeters} />
                <KeepAreaInView center={center} />
                <MoveOnClick onMove={onMove} />
                <Circle center={toLatLng(center)} radius={radiusMeters}
                    pathOptions={{ color: ROUTE_COLOR, weight: 2, dashArray: "6 6", fillOpacity: 0.06 }} />
                {bins.map(bin => (
                    <CircleMarker key={bin._id} center={toLatLng(bin.location.coordinates)} radius={4} interactive={false}
                        pathOptions={{ color: getColor(bin.status, 'fill', thresholds), weight: 1, fillOpacity: 0.85 }} />
                ))}
                {depot && <Marker position={toLatLng(depot)} icon={createRouteEndIcon(t("pages.routes.plan.depot"))} zIndexOffset={1000} />}
            </MapComponent>
        </div>
    )
}

export default PlanAreaMap
