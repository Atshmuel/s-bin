import DataTable from "@/components/DataTable"
import { Badge } from "@/components/ui/badge";
import Battery from "@/components/bins/Battary";
import { format } from "date-fns";
import { getVariant } from "@/utils/binHelpers";
import { Link } from "react-router-dom";
import { LinkIcon } from "lucide-react";
import { useLogs } from "@/hooks/bins/binLogs/useBinLogs";

function AllLogs() {
    const { allLogs, isLoadingLogs, logsError } = useLogs()

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
            <DataTable columns={columns} data={allLogs ?? []} isLoading={isLoadingLogs} error={logsError} title='all logs' />
        </div >
    )
}

export default AllLogs
