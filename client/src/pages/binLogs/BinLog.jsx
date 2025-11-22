import BinCard from "@/components/bins/BinCard"
import LogCard from "@/components/bins/bin-logs/LogCard"
import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useMapSettings } from "@/contexts/mapContext"
import { useLog } from "@/hooks/bins/binLogs/useLog"
import { getColor, getVariant } from "@/utils/binHelpers"
import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

function BinLog() {
    const { mapContainerRef, scrollToMap } = useMapSettings();
    const { id } = useParams()
    const { log, isLoadingLog } = useLog(id);

    if (isLoadingLog) {
        return <div className="flex h-full w-full justify-center items-center">
            <Spinner className={'size-24'} />
        </div>
    }


    const { bin } = log

    console.log(bin.location.coordinates);


    return (
        <div className="flex flex-col space-y-4 h-full">
            <Link to={`/bins/${log?.binId}`}>
                <Button className={'w-fit mb-2'} variant={'link'}> <ArrowLeft />Back</Button>
            </Link>
            <div className="flex flex-wrap justify-start gap-4">
                <BinCard className="flex-1 min-w-xs" bin={bin} actions={false} handleLocationClick={() => scrollToMap(bin.location.coordinates)} isLoading={isLoadingLog} />
                <LogCard className="min-w-xs flex-1 h-fit" log={log} isLoading={isLoadingLog} />
            </div>
            <div ref={mapContainerRef} className="rounded-2xl overflow-hidden h-[450px]">
                <MapComponent zoom={14} center={bin.location.coordinates} legend={true} >
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getColor(bin.status.level)} popup={
                        <div className="space-y-2 text-sm p-2 relative">
                            <Badge className='absolute top-2.5 right-0' variant={getVariant(bin.status.health)}>{bin.status.health}</Badge>
                            <h3 className="font-bold lg:text-md">Name: {bin.binName}</h3>
                            <div >
                                <p className="!my-1">Fill Level: <span className={`font-semibold`}>{bin.status.level}%</span></p>
                                <p className="!my-1">Last Updated: {new Date(bin.status.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    } />
                </MapComponent>
            </div>
        </div>

    )
}

export default BinLog
