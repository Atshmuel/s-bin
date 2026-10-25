import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import polyline from "@mapbox/polyline";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import BinPopupCard from "@/components/map/BinPopupCard";
import { DriverPosition, DrivingBar } from "@/components/map/RouteDriving";
import { Spinner } from "@/components/ui/spinner";
import { useBins } from "@/hooks/bins/useBins";
import { useBin } from "@/hooks/bins/useBin";
import { useMapBins, useMapExtent } from "@/hooks/bins/useMapBins";
import { useMapSettings } from "@/hooks/useMapSettings";
import { getColor, isGateway } from "@/utils/binHelpers";
import { getColocatedShifts, getDeviceRole, getDeviceRoleIcon } from "@/utils/deviceRoles";
import { ROUTE_COLOR, createCellIcon, createClusterIcon, createRouteEndIcon, createStopIcon } from "@/utils/mapClusters";
import { CLUSTER_UNTIL_ZOOM, MAP_VIEW_DEBOUNCE_MS } from "@/utils/constants";
import { toLatLng } from "@/utils/geo";

const SEARCH_PARAMS = Object.freeze(["coordinates", "radius", "minLevel", "maxLevel", "health"]);

function viewOf(map) {
    const bounds = map.getBounds()
    return { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast(), zoom: map.getZoom() }
}

// Reports the map's view when it opens and each time it stops moving (after
// MAP_VIEW_DEBOUNCE_MS). Rendered inside the map, so it only ever reads the
// live one.
function MapViewWatcher({ onView }) {
    const map = useMap()
    const timer = useRef(null)
    useEffect(() => {
        map.whenReady(() => onView(viewOf(map)))
        return () => clearTimeout(timer.current)
    }, [map, onView])
    useMapEvents({
        moveend: () => {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => onView(viewOf(map)), MAP_VIEW_DEBOUNCE_MS)
        },
    })
    return null
}

// A planned route on its own: its line, where it starts and ends, and its
// stops numbered in driving order.
function RouteView({ plan }) {
    const { t } = useTranslation()
    const sameEnd = plan.end && plan.end[0] === plan.start[0] && plan.end[1] === plan.start[1]
    return (
        <>
            <Polyline positions={polyline.decode(plan.geometry)} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.7, lineJoin: "round" }} />
            {plan.stops.map(stop => (
                <Marker key={stop._id} position={toLatLng(stop.location.coordinates)}
                    icon={createStopIcon(stop.order, getColor(stop.status), (plan.doneIds ?? []).includes(stop._id))}>
                    <Tooltip direction="top" offset={[0, -14]}>
                        {t("mapLegend.route.stopTooltip", { order: stop.order, count: plan.stops.length, name: stop.binName })}
                    </Tooltip>
                    <Popup>
                        <div className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold">{stop.order}. {stop.binName}</span>
                            <span>{t("mapLegend.route.stopFullness", { percent: Math.round(stop.fullness ?? 0) })}</span>
                            {stop.loadKg != null && <span>{t("mapLegend.route.stopLoad", { kg: stop.loadKg.toLocaleString() })}</span>}
                            <Link to={`/bins/${stop._id}`}>{t("viewBin")}</Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
            <Marker position={toLatLng(plan.start)} icon={createRouteEndIcon(t(sameEnd ? "mapLegend.route.startEnd" : "mapLegend.route.start"))} zIndexOffset={1000} />
            {plan.end && !sameEnd && <Marker position={toLatLng(plan.end)} icon={createRouteEndIcon(t("mapLegend.route.end"))} zIndexOffset={1000} />}
        </>
    )
}

// A crowded view's grid cells, counted by the server: each a group marker
// that zooms in on its devices.
function MapCells({ cells }) {
    const map = useMap()
    return cells.map(cell => (
        <Marker key={`${cell.lat},${cell.lng}`} position={[cell.lat, cell.lng]} icon={createCellIcon(cell.count, cell.urgency)}
            eventHandlers={{ click: () => map.setView([cell.lat, cell.lng], Math.min(map.getZoom() + 2, CLUSTER_UNTIL_ZOOM)) }} />
    ))
}
const DEFAULT_CENTER = Object.freeze([32.0853, 34.7818]);

// The map's devices: a caller's own (the dashboard's), the map search's
// results (its parameters in the URL), or otherwise the devices in view,
// loaded again each time the map stops moving; a crowded view comes as the
// server's grid cells instead, so every count is true. The map page first
// opens around all of the user's devices.
function BinMap({ zoom, center, legend = true, legendForm = true, binsToUse = null }) {
    const { t } = useTranslation()
    const { map, routePlan, setRoutePlan } = useMapSettings()
    // Driving a route: the driver's position and whether the map follows it.
    const [driverPosition, setDriverPosition] = useState(null)
    const [following, setFollowing] = useState(true)
    const stopFollowing = useCallback(() => setFollowing(false), [])
    const [searchParams] = useSearchParams();
    const hasOwnBins = binsToUse !== null
    const isSearch = SEARCH_PARAMS.every(param => searchParams.has(param))
    // One bin from a link (?binId=, as the bins list opens it): the map opens
    // on it and shows only it.
    const binId = searchParams.get("binId")
    const focusesBin = !hasOwnBins && Boolean(binId)
    const { bin: focusBin, isLoadingBins: isLoadingFocusBin } = useBin(focusesBin ? binId : null)
    // A planned route shows on its own (the map page's, not the dashboard's).
    const showsRoute = !hasOwnBins && !focusesBin && Boolean(routePlan)
    const followsView = !hasOwnBins && !isSearch && !showsRoute && !focusesBin

    const zoomFromUrl = Number(searchParams.get("zoom"))
    const locationFromUrl = searchParams.get("coordinates")?.split(",").map(Number)

    const { allBins: searchBins, isLoadingBins } = useBins(1, 0, "", { enabled: !hasOwnBins && isSearch })

    // The view, reported by MapViewWatcher inside the map.
    const [box, setBox] = useState(null)
    const { mapBins, mapCells, isFetchingMapBins } = useMapBins(box, { enabled: followsView })
    const opensAroundAll = followsView && !locationFromUrl
    const { extent, isLoadingExtent } = useMapExtent({ enabled: opensAroundAll })

    let devices = (showsRoute ? [] : hasOwnBins ? binsToUse : focusesBin ? (focusBin ? [focusBin] : [])
        : isSearch ? searchBins : mapBins) ?? []
    if (binId) devices = devices.filter(bin => bin._id === binId)

    const shifts = getColocatedShifts(devices);

    // A group whose devices only separate at street level (the same spot) flies
    // there, where they stand side by side and their popups stay open; Leaflet's
    // default would fan them out, and moving the map folds the fan and closes the
    // popup. Other groups zoom to fit their devices.
    function handleClusterClick(event) {
        const cluster = event.layer
        if (!map) return
        if (map.getBoundsZoom(cluster.getBounds()) >= CLUSTER_UNTIL_ZOOM) {
            map.flyTo(cluster.getLatLng(), CLUSTER_UNTIL_ZOOM)
        } else {
            cluster.zoomToBounds({ padding: [48, 48] })
        }
    }
    // For the popups: a leaf's gateway by name and how many devices a gateway
    // relays for. The map's own view comes with both from the server, which
    // also knows devices outside the view; otherwise they are counted from the
    // devices shown.
    const binNames = new Map(devices.map((bin) => [bin._id, bin.binName]))
    const relayCounts = new Map()
    for (const bin of devices) {
        const gatewayId = bin.status?.connection?.via === "mesh" ? bin.status.connection.gatewayId : null
        if (gatewayId) relayCounts.set(gatewayId, (relayCounts.get(gatewayId) ?? 0) + 1)
    }

    const routePoints = showsRoute ? [routePlan.start, ...routePlan.stops.map(stop => stop.location.coordinates)].map(toLatLng) : []
    const opening = showsRoute ? { bounds: routePoints }
        : locationFromUrl ? { center: locationFromUrl }
        : focusBin ? { center: toLatLng(focusBin.location.coordinates) }
        : center ? { center }
            : opensAroundAll && extent ? { bounds: [[extent.south, extent.west], [extent.north, extent.east]] }
                : { center: devices[0] ? toLatLng(devices[0].location.coordinates) : DEFAULT_CENTER }
    const isLoading = !hasOwnBins && ((isSearch && isLoadingBins) || (opensAroundAll && isLoadingExtent) || (focusesBin && isLoadingFocusBin))

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-300 shadow-md">
            <MapComponent {...opening} zoom={zoomFromUrl ? zoomFromUrl : zoom ?? 11} legend={legend} legendForm={legendForm} isLoading={isLoading} >
                <MarkerClusterGroup
                    chunkedLoading
                    showCoverageOnHover={false}
                    maxClusterRadius={50}
                    disableClusteringAtZoom={CLUSTER_UNTIL_ZOOM}
                    spiderfyOnMaxZoom={false}
                    zoomToBoundsOnClick={false}
                    onClick={handleClusterClick}
                    iconCreateFunction={createClusterIcon}
                >
                    {devices.map((bin) => (
                        <CustomMarker key={bin._id} icon={getDeviceRoleIcon(getDeviceRole(bin))} position={toLatLng(bin.location.coordinates)}
                            color={isGateway(bin) ? getColor(bin.status, 'battery') : getColor(bin.status)} shiftX={shifts[bin._id] ?? 0}
                            popup={<BinPopupCard
                                bin={bin}
                                gatewayName={bin.gatewayName ?? bin.gateway?.binName ?? binNames.get(bin.status?.connection?.gatewayId)}
                                relayCount={bin.relayCount ?? relayCounts.get(bin._id) ?? 0}
                            />} />
                    ))}
                </MarkerClusterGroup>
                {followsView && <MapViewWatcher onView={setBox} />}
                {followsView && mapCells && <MapCells cells={mapCells} />}
                {showsRoute && <RouteView plan={routePlan} />}
                {showsRoute && routePlan.driving && (
                    <DriverPosition following={following} onStopFollowing={stopFollowing} onPosition={setDriverPosition} />
                )}
            </MapComponent>
            {showsRoute && routePlan.driving && (
                <DrivingBar plan={routePlan} position={driverPosition} following={following}
                    onFollow={() => setFollowing(true)}
                    onDone={(stopId) => setRoutePlan({ ...routePlan, doneIds: [...(routePlan.doneIds ?? []), stopId] })}
                    onUndo={() => setRoutePlan({ ...routePlan, doneIds: (routePlan.doneIds ?? []).slice(0, -1) })}
                    onStop={() => { setRoutePlan({ ...routePlan, driving: false }); setDriverPosition(null) }}
                    onFinish={() => { setRoutePlan(null); setDriverPosition(null) }}
                    distanceTo={(from, to) => L.latLng(from).distanceTo(L.latLng(to))} />
            )}
            {/* Above Leaflet's panes and controls (1000); clicks pass through to the map. */}
            {followsView && isFetchingMapBins && (
                <div className="pointer-events-none absolute inset-x-0 top-3 z-[1001] flex justify-center px-14">
                    <span className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs shadow-md">
                        <Spinner className="size-3.5" />
                        {t("components.binMap.loading")}
                    </span>
                </div>
            )}
        </div >
    )
}

export default BinMap
