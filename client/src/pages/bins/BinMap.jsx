import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getColor, getVariant } from "@/utils/binHelpers";
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { useSearchParams } from "react-router-dom";



function BinMap({ zoom, center, legend = true, legendForm = true }) {
    //should get the bins from context or reactQuery and display them on the map
    const [searchParams] = useSearchParams();

    const zoomFromUrl = Number(searchParams.get("zoom"))
    const binId = searchParams.get("binId")



    const bins = [
        {
            _id: "670b1a1a1a1a1a1a1a1a1a1a",
            binName: "BIN-001",
            location: {
                type: "Point",
                coordinates: [32.9050, 35.4950],

            },
            status: {
                health: "critical",
                level: 25,
                battery: 40,
                updatedAt: "2025-10-13T10:30:00.000Z",
            },
            ownerId: "652f1b1b1b1b1b1b1b1b1b1b",
            levelLogs: [],
            createdAt: "2025-10-13T10:30:00.000Z",
            updatedAt: "2025-10-13T10:30:00.000Z",
            __v: 0,
        },
        {
            _id: "670b2b2b2b2b2b2b2b2b2b2b",
            binName: "BIN-002",
            location: {
                type: "Point",
                coordinates: [32.9100, 35.51],
            },
            status: {
                health: "good",
                level: 68,
                battery: 45,
                updatedAt: "2025-10-13T10:30:00.000Z",
            },
            ownerId: "652f2c2c2c2c2c2c2c2c2c2c",
            levelLogs: ["653f3d3d3d3d3d3d3d3d3d3d"],
            createdAt: "2025-10-13T10:30:00.000Z",
            updatedAt: "2025-10-13T10:30:00.000Z",
            __v: 0,
        },
        {
            _id: "670b3c3c3c3c3c3c3c3c3c3c",
            binName: "BIN-003",
            location: {
                type: "Point",
                coordinates: [32.8938, 35.5018],
            },
            status: {
                health: "warning",
                level: 95,
                battery: 75,
                updatedAt: "2025-10-13T10:30:00.000Z",
            },
            ownerId: "652f4e4e4e4e4e4e4e4e4e4e",
            levelLogs: [
                "653f5f5f5f5f5f5f5f5f5f5f",
                "653f6a6a6a6a6a6a6a6a6a6a",
            ],
            createdAt: "2025-10-13T10:30:00.000Z",
            updatedAt: "2025-10-13T10:30:00.000Z",
            __v: 0,
        },
        {
            _id: "670b3c3c3c3c3c3c333c3c3c",
            binName: "BIN-003",
            location: {
                type: "Point",
                coordinates: [32.8975, 35.5140],
            },
            status: {
                health: "critical",
                level: 55,
                battery: 95,
                updatedAt: "2025-10-13T10:30:00.000Z",
            },
            ownerId: "652f4e4e4e5e4e4e4e4e4e4e",
            levelLogs: [
                "653f5f5f5f585f5f5f5f5f5f",
                "653f6a6a6a6a6a9a6a6a6a6a",
            ],
            createdAt: "2025-10-13T10:30:00.000Z",
            updatedAt: "2025-10-13T10:30:00.000Z",
            __v: 0,
        },
    ];

    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={center ? center : bins && bins.length ? bins[0].location.coordinates : [32.0853, 34.7818]} zoom={zoom ?? 11} legend={legend} legendForm={legendForm} >
                {bins.map((bin) => (
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
