import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getBinColor, getVariant } from "@/utils/binHelpers"
import { ArrowLeft, CalendarClock, GaugeCircle, InfoIcon, Trash2 } from "lucide-react"

function BinLogs() {
    const bin = {
        _id: "670b1a1a1a1a1a1a1a1a1a1a",
        binCode: "BIN-001",
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
        binCode: "BIN-001",
        timestamp: "2025-10-14T11:25:00.000Z",
        type: "Fill Level Update",
        case: 'info', //info | error
        oldLevel: 22,
        newLevel: 68,
        message: "Bin nearing capacity threshold (above 65%)",
    }
    return (
        <div className="flex flex-col space-y-4 h-fit">
            <Button className={'w-fit mb-2'} variant={'link'}> <ArrowLeft />Back</Button>
            <div className="flex flex-wrap justify-start gap-4">
                <Card className="flex-1 min-w-xs">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <h3 className="flex items-center gap-2"><Trash2 size={20} /> <span>{bin.binCode}</span></h3>
                            <Badge variant={getVariant(bin.status.health)}>
                                {bin.status.health.toUpperCase()}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Last updated: {new Date(bin.status.updatedAt).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium">Fill Level:</span>
                            <span>{bin.status.level}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Location:</span>
                            <span>{bin.location.coordinates.join(", ")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Owner ID:</span>
                            <span className="truncate max-w-[220px]">{bin.ownerId}</span>
                        </div>
                        <div>
                            <span className="font-medium">Recent Level Logs:</span>
                            <ul className="mt-1 list-disc list-inside text-muted-foreground">
                                {bin.levelLogs.map((log, idx) => (
                                    <li key={idx}>
                                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {log.level}%
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className='flex justify-center gap-4'>
                        <Button className='flex-1' variant={'destructive'}>
                            Delete
                        </Button>
                        <Button className='flex-1'>
                            Edit
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="min-w-sm flex-1">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Log {log.id} Details</span>
                            <InfoIcon color={`${log.case === 'info' ? 'oklch(0.723 0.219 149.579)' : 'oklch(0.577 0.245 27.325)'}`} size={20} />
                        </CardTitle>
                        <CardDescription>
                            {log.type} – {new Date(log.timestamp).toLocaleString()}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium flex items-center gap-2">
                                <Trash2 size={16} /> Bin Code:
                            </span>
                            <span>{log.binCode}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="font-medium flex items-center gap-2">
                                <GaugeCircle size={16} /> Fill Level:
                            </span>
                            <span>
                                {log.oldLevel}% → <b>{log.newLevel}%</b>
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="font-medium flex items-center gap-2">
                                <CalendarClock size={16} /> Time:
                            </span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div>
                            <span className="font-medium">Message:</span>
                            <p className="text-muted-foreground mt-1">{log.message}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="rounded-2xl overflow-hidden h-[450px]">
                <MapComponent zoom={14} center={bin.location.coordinates} legend={true} >
                    <CustomMarker key={bin._id} position={bin.location.coordinates} icon={Trash2} color={getBinColor(bin.status.level)} popup={
                        <div className="space-y-2 text-sm p-2 relative">
                            <Badge className='absolute top-3.5 right-0' variant={getVariant(bin.status.health)}>{bin.status.health}</Badge>
                            <h3 className="font-bold text-lg">Bin Name: {bin.binCode}</h3>
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
