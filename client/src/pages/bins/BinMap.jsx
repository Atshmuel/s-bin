import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge";
import { getBinColor, getVariant } from "@/utils/binHelpers";

import { Trash2 } from "lucide-react"

function BinMap({ zoom, center, legend = true }) {
    //should get the bins from context or reactQuery and display them on the map
    const bins = [
        {
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
        },
        {
            _id: "670b2b2b2b2b2b2b2b2b2b2b",
            binCode: "BIN-002",
            location: {
                type: "Point",
                coordinates: [32.9100, 35.51],
            },
            status: {
                health: "good",
                level: 68,
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
            binCode: "BIN-003",
            location: {
                type: "Point",
                coordinates: [32.8938, 35.5018],
            },
            status: {
                health: "warning",
                level: 95,
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
            binCode: "BIN-003",
            location: {
                type: "Point",
                coordinates: [32.8975, 35.5140],
            },
            status: {
                health: "critical",
                level: 55,
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
            <MapComponent center={center ? center : bins && bins.length ? bins[0].location.coordinates : [32.0853, 34.7818]} zoom={zoom ?? 11} legend={legend} >
                {bins.map((bin) => (
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

                ))}
            </MapComponent>
        </div >
    )
}

export default BinMap
