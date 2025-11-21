import BinCard from "@/components/bins/BinCard"
import DataTable from "@/components/DataTable"
import Battery from "../../components/bins/Battary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getVariant } from "@/utils/binHelpers"

function BinDetails() {
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
        logs: [
            {
                _id: "68f26d903dac2e78b0a3dfff",
                binId: "68f25bd2d04737ecca9de1b1",
                type: "System",
                severity: "info",
                newLevel: 10,
                health: "good",
                source: "sensor",
                battery: 80,
                createdAt: "2025-10-17T16:23:44.389Z",
                updatedAt: "2025-10-17T16:23:44.389Z",
                __v: 0,
            },
            {
                _id: "68f26d953dac2e78b0a3e004",
                binId: "68f25bd2d04737ecca9de1b1",
                type: "System",
                severity: "critical",
                newLevel: 90,
                health: "good",
                source: "sensor",
                battery: 90,
                createdAt: "2025-10-17T16:23:49.898Z",
                updatedAt: "2025-10-17T16:23:49.898Z",
                __v: 0,
            },
        ],
    }

    const logsColumns = [
        {
            header: 'severity',
            accessorKey: 'severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}>
                        {severity}
                    </Badge>
                );
            }
        },
        {
            header: 'type',
            accessorKey: 'type',
        },

        {
            header: 'new level',
            accessorKey: 'newLevel',
        },
        {
            header: 'health',
            accessorKey: 'health',
            cell: ({ row }) => {
                const health = row.original.health;
                return (
                    <Badge variant={getVariant(health)} >
                        {health}
                    </Badge>
                );
            },
        },

        {
            header: 'battery',
            accessorKey: 'battery',
            cell: ({ row }) => {
                console.log(row);

                return <Battery level={row.original.battery} />
            }
        },
        {
            header: 'source',
            accessorKey: 'source',
        },
        {
            header: 'created at',
            accessorKey: 'createdAt',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]

    return (
        <div className="flex flex-wrap gap-4">
            <BinCard className='flex-1 min-w-xs flex-col justify-between' bin={bin} />
            <Card className='flex-2  min-w-xs md:min-w-md'>
                <CardHeader>
                    <h3 className="text-xl md:text-2xl"></h3>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        Logs Overview
                    </CardTitle>
                    <CardDescription>Review detailed records of all bin activities, including fill levels, timestamps, and event types.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={logsColumns} data={bin.logs} />
                </CardContent>
            </Card>
        </div>
    )
}

export default BinDetails
