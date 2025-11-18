import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge";
import { useBins } from "@/hooks/bins/useBins";
import { getColor, getVariant } from "@/utils/binHelpers";
import { Battery } from "../../components/bins/Battary"
import { useSearchParams } from "react-router-dom";



function BinMap({ zoom, center, legend = true, legendForm = true, binsToUse = null }) {
    const { allBins } = useBins()
    if (!binsToUse) {
        binsToUse = allBins
    }
    const [searchParams] = useSearchParams();

    const zoomFromUrl = Number(searchParams.get("zoom"))
    const binId = searchParams.get("binId")



    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={center ? center : binsToUse && binsToUse.length ? binsToUse[0].location.coordinates : [32.0853, 34.7818]} zoom={zoom ?? 11} legend={legend} legendForm={legendForm} >
                {binsToUse.map((bin) => (
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getColor(bin.status.level)} popup={
                        <div className="space-y-2 text-sm p-2 relative">
                            <Badge className='absolute top-3.5 right-0' variant={getVariant(bin.status.health)}>{bin.status.health}</Badge>
                            <h3 className="font-bold text-lg flex items-center gap-3">
                                <span>{bin.binName}</span>
                                <Battery level={bin.status.level} />
                            </h3>
                            <div >
                                <p className="!my-1">Fill Level: <span className={`font-semibold`}>{bin.status.level}%</span></p>
                                <p className="!my-1">Last Updated: {new Date(bin.status.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    } />

                ))}
            </MapComponent>
        </div >
    )
}

export default BinMap
