import BinCard from "@/components/bins/BinCard"
import LogCard from "@/components/bins/bin-logs/LogCard"
import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMapSettings } from "@/contexts/mapContext"
import { getColor, getVariant } from "@/utils/binHelpers"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"



function BinLog() {
    const { mapContainerRef, scrollToMap } = useMapSettings();


    const bin = {
        _id: "68f25bd2d04737ecca9de1b1",
        binName: "BIN-10000001",
        deviceKey: "336bd87d07914084dafc89c1940d2d436bb84149baf09823d4144e976f2cadfa",
        location: {
            type: "Point",
            coordinates: [32.084, 34.782],
        },
        status: {
            health: "warning",
            level: 91,
            battery: 75,
            updatedAt: "2025-10-17T16:41:41.577Z",
        },
        ownerId: "68c5841c822b68f8c6fc4224",
        maintenance: {
            lastServiceAt: "2025-10-17T17:02:50.791Z",
            nextServiceAt: "2025-11-16T17:02:50.791Z",
            notes: "Fixed the sensor!",
            technicianId: "68c5841c822b68f8c6fc4224",
        },
        __v: 0,
        createdAt: "2025-10-17T15:08:02.627Z",
        updatedAt: "2025-10-17T17:04:28.218Z",
    }
    const log = {
        _id: "68f26d903dac2e78b0a3dfff",
        binId: "68f25bd2d04737ecca9de1b1",
        type: "log",
        severity: "info",
        newLevel: 10,
        oldLevel: 0,
        battery: 80,
        health: "good",
        source: "manual",
        createdAt: "2025-10-17T16:23:44.389Z",
        updatedAt: "2025-10-17T16:23:44.389Z",
        __v: 0,
    }



    return (
        <div className="flex flex-col space-y-4 h-full">
            <Link to={`/bins/${bin._id}`}>
                <Button className={'w-fit mb-2'} variant={'link'}> <ArrowLeft />Back</Button>
            </Link>
            <div className="flex flex-wrap justify-start gap-4">
                <BinCard className="flex-1 min-w-xs" bin={bin} actions={false} handleLocationClick={() => scrollToMap(bin.location.coordinates)} />
                <LogCard className="min-w-xs flex-1 h-fit" log={log} />
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
