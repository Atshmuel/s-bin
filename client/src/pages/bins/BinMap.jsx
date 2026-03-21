import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { useBins } from "@/hooks/bins/useBins";
import { getColor } from "@/utils/binHelpers";
import { useSearchParams } from "react-router-dom";
import BinPopupCard from "@/components/map/BinPopupCard";
import { Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";

function BinMap({ zoom, center, legend = true, legendForm = true, binsToUse = null }) {
    const { allBins, isLoadingBins } = useBins()

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

    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={locationFromUrl ? locationFromUrl : center ? center : binsToUse && binsToUse.length ? binsToUse[0].location.coordinates : [32.0853, 34.7818]} zoom={zoomFromUrl ? zoomFromUrl : zoom ?? 11} legend={legend} legendForm={legendForm} isLoading={isLoadingBins} >
                {binsToUse?.map((bin) => (
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getColor(bin.status.level)} popup={<BinPopupCard bin={bin} />} />
                ))}
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
