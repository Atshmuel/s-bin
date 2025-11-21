import DataTable from "@/components/DataTable"
import { Badge } from "@/components/ui/badge";
import Battery from "@/components/bins/Battary";
import { format } from "date-fns";
import { getVariant } from "@/utils/binHelpers";
import { Link } from "react-router-dom";
import { LinkIcon } from "lucide-react";

function AllLogs() {

    const log = [{
        _id: "68f26d903dac2e78b0a3dfff",
        binId: "68f25bd2d04737ecca9de1b1",
        type: "maintenance",
        severity: "info",
        newLevel: 10,
        oldLevel: 0,
        battery: 80,
        health: "good",
        source: "manual",
        createdAt: "2025-10-17T16:23:44.389Z",
        updatedAt: "2025-10-17T16:23:44.389Z",
        __v: 0,
    }, {
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
    }, {
        _id: "68f26d903dac2e78b0a3dfff",
        binId: "68f25bd2d04737ecca9de1b1",
        type: "error",
        severity: "info",
        newLevel: 10,
        oldLevel: 0,
        battery: 80,
        health: "good",
        source: "manual",
        createdAt: "2025-10-17T16:23:44.389Z",
        updatedAt: "2025-10-17T16:23:44.389Z",
        __v: 0,
    }]

    const columns = [
        {
            header: 'created at',
            accessorKey: 'createdAt',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
            enableSorting: true,
        },
        {
            header: 'type',
            accessorKey: 'type',
        },
        {
            header: 'severity',
            accessorKey: 'severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}
                    >
                        {severity}
                    </Badge>
                );
            }
        },
        {
            header: 'fill level',
            accessorKey: 'newLevel',
        },
        {
            header: 'battery',
            accessorKey: 'battery',
            cell: ({ row }) => {
                return <Battery level={row.original.battery} />
            }
        },
        {
            header: 'health',
            accessorKey: 'health',
            cell: ({ row }) => {
                const health = row.original.health;
                return (
                    <Badge variant={getVariant(health)}
                    >
                        {health}
                    </Badge>
                );
            },
        },
        {
            header: 'source',
            accessorKey: 'source',
        },
        {
            header: 'View log',
            accessorKey: '_id',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/logs/${id}`}
                    >
                        <LinkIcon size={14} /> <span>View log</span>
                    </Link>
                );
            },
        }
    ]
    return (
        <div>
            <DataTable columns={columns} data={log} title='all logs' />
        </div >
    )
}

export default AllLogs
