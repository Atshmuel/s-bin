import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBins } from "@/hooks/bins/useBins";
import { getColor, getVariant } from "@/utils/binHelpers";
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";

function BinMap({ zoom, center, legend = true, legendForm = true }) {
    const { allBins } = useBins()

    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={center ? center : allBins && allBins.length ? allBins[0].location.coordinates : [32.0853, 34.7818]} zoom={zoom ?? 11} legend={legend} legendForm={legendForm} >
                {allBins.map((bin) => (
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getColor(bin.status.level)} popup={
                        <div className="space-y-2 text-sm p-2 relative">
                            <Badge className='absolute top-3.5 right-0' variant={getVariant(bin.status.health)}>{bin.status.health}</Badge>
                            <h3 className="font-bold text-lg flex items-center gap-3">
                                <span>{bin.binName}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            {
                                                bin.status.battery > 75 ? <BatteryFull color={getColor(bin.status.battery, "battery")} /> :
                                                    bin.status.battery > 50 ? <BatteryMedium color={getColor(bin.status.battery, "battery")} /> : <BatteryLow color={getColor(bin.status.battery, "battery")} />
                                            }
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className={'z-999'}>{bin.status.battery}%</TooltipContent>
                                </Tooltip>
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
