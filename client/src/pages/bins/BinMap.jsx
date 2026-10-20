import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { useBins } from "@/hooks/bins/useBins";
import { getColor, isGateway } from "@/utils/binHelpers";
import { getColocatedShifts, getDeviceRole, getDeviceRoleIcon } from "@/utils/deviceRoles";
import { useSearchParams } from "react-router-dom";
import BinPopupCard from "@/components/map/BinPopupCard";
import { Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { CLUSTER_UNTIL_ZOOM, createClusterIcon } from "@/utils/mapClusters";
import { useMapSettings } from "@/contexts/mapContext";

// The map page shows every device, not one page of the list.
const MAP_BINS_LIMIT = 1000

function BinMap({ zoom, center, legend = true, legendForm = true, binsToUse = null }) {
    // A caller with its own bins (the dashboard's) needs no request of its own.
    const hasOwnBins = binsToUse !== null
    const { allBins, isLoadingBins } = useBins(1, MAP_BINS_LIMIT, "", { enabled: !hasOwnBins })
    const { map } = useMapSettings()

    if (!binsToUse) {
        binsToUse = allBins
    }
    const [searchParams] = useSearchParams();

    const binId = searchParams.get("binId")
    const zoomFromUrl = Number(searchParams.get("zoom"))
    const route = searchParams.get("route")
    const locationFromUrl = searchParams.get("coordinates")?.split(",").map(Number)

    if (binId)
        binsToUse = binsToUse.filter(bin => bin._id === binId)

    const routeCoordinates = route ? polyline.decode(route) : [];
    const shifts = getColocatedShifts(binsToUse);

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
    // For the popups: a leaf's gateway by name, and how many bins each device
    // relays for, from the devices already on the map.
    const knownBins = allBins ?? binsToUse ?? []
    const binNames = new Map(knownBins.map((bin) => [bin._id, bin.binName]))
    const relayCounts = new Map()
    for (const bin of knownBins) {
        const gatewayId = bin.status?.connection?.via === "mesh" ? bin.status.connection.gatewayId : null
        if (gatewayId) relayCounts.set(gatewayId, (relayCounts.get(gatewayId) ?? 0) + 1)
    }

    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={locationFromUrl ? locationFromUrl : center ? center : binsToUse && binsToUse.length ? binsToUse[0].location.coordinates : [32.0853, 34.7818]} zoom={zoomFromUrl ? zoomFromUrl : zoom ?? 11} legend={legend} legendForm={legendForm} isLoading={!hasOwnBins && isLoadingBins} >
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
                    {binsToUse?.map((bin) => (
                        <CustomMarker key={bin._id} icon={getDeviceRoleIcon(getDeviceRole(bin))} position={bin.location.coordinates}
                            color={isGateway(bin) ? getColor(bin.status, 'battery') : getColor(bin.status)} shiftX={shifts[bin._id] ?? 0}
                            popup={<BinPopupCard
                                bin={bin}
                                gatewayName={binNames.get(bin.status?.connection?.gatewayId)}
                                relayCount={relayCounts.get(bin._id) ?? 0}
                            />} />
                    ))}
                </MarkerClusterGroup>
                <Polyline positions={routeCoordinates}
                    pathOptions={{
                        color: "#3b82f6",
                        weight: 5,
                        opacity: 0.6,
                        lineJoin: 'round'
                    }} />
            </MapComponent>
        </div >
    )
}

export default BinMap
