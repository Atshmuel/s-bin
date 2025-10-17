import BinCard from "@/components/bins/BinCard"
import LogCard from "@/components/bins/bin-logs/LogCard"
import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBinColor, getVariant } from "@/utils/binHelpers"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

function BinLogs() {
    const bin = {
        _id: "670b1a1a1a1a1a1a1a1a1a1a",
        binName: "BIN-001",
        location: {
            type: "Point",
            coordinates: [32.9050, 35.4950],

        },
        status: {
            health: "critical",
            level: 25,
            updatedAt: "2025-10-13T10:30:00.000Z",
        },
        ownerId: "652f1b1b1b1b1b1b1b1b1b1b",
        levelLogs: [],
        createdAt: "2025-10-13T10:30:00.000Z",
        updatedAt: "2025-10-13T10:30:00.000Z",
        __v: 0,
    }

    const log = {
        id: "002d002-sdad-d2d-d2d",
        binName: "BIN-001",
        timestamp: "2025-10-14T11:25:00.000Z",
        type: "Fill Level Update",
        case: 'info', //info | error
        oldLevel: 22,
        newLevel: 68,
        message: "Bin nearing capacity threshold (above 65%)",
    }
    return (
        <div className="flex flex-col space-y-4 h-full">
            <Link to={`/bins/${bin._id}`}>
                <Button className={'w-fit mb-2'} variant={'link'}> <ArrowLeft />Back</Button>
            </Link>
            <div className="flex flex-wrap justify-start gap-4">
                <BinCard className="flex-1 min-w-xs" bin={bin} actions={false} />
                <LogCard className="min-w-sm flex-1" log={log} />
            </div>
            <div className="rounded-2xl overflow-hidden h-[450px]">
                <MapComponent zoom={14} center={bin.location.coordinates} legend={true} >
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getBinColor(bin.status.level)} popup={
                        <div className="space-y-2 text-sm p-2 relative">
                            <Badge className='absolute top-3.5 right-0' variant={getVariant(bin.status.health)}>{bin.status.health}</Badge>
                            <h3 className="font-bold text-lg">Bin Name: {bin.binName}</h3>
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

export default BinLogs
