import { format } from "date-fns";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import Battery from "../../components/bins/Battary";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";

const binsList = [
    {
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
    },
]


function BinsList() {
    //should allow to get by status, location and or level
    //page can be either table or cards (toggle)

    const columns = [
        {
            header: 'bin name',
            accessorKey: 'binName',
            enableSorting: true,
            cell: ({ row }) => {
                const id = row.original._id;
                const name = row.getValue("binName");
                return (
                    <Link
                        to={`/bins/${id}`}
                    >
                        {name}
                    </Link>
                );
            },
        },
        {
            header: 'location',
            accessorKey: 'location.coordinates',
            cell: ({ row }) => {
                const coords = row.original.location.coordinates;
                const id = row.original._id;
                return (
                    <Link
                        to={`/bins/map?binId=${id}&zoom=18`}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-row gap-2 text-primary">
                                    <MapPin size={18} />
                                    <span>{coords.join(", ")}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                Locate the bin on the map
                            </TooltipContent>
                        </Tooltip>
                    </Link>
                )
            }
        },
        {
            header: 'fill level',
            accessorKey: 'status.level',
        },

        {
            header: 'health',
            accessorKey: 'status.health',
            cell: ({ row }) => {
                const health = row.original.status.health;
                const variant = health === 'warning' ? 'pending' : health === 'critical' ? 'suspended' : 'default';
                return (
                    <Badge variant={variant}
                    >
                        {health}
                    </Badge>
                );
            },
        },
        {
            header: 'battery',
            accessorKey: 'status.battery',
            cell: ({ row }) => {
                return <Battery level={row.original.status.battery} />
            }
        },
        {
            header: 'maintenance',
            accessorKey: 'maintenance.lastServiceAt',
            cell: ({ row }) => {
                return format(new Date(row.original.maintenance.lastServiceAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]
    return (
        <DataTable columns={columns} data={binsList} title='bins list' />
    )
}

export default BinsList
