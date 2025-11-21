import { format } from "date-fns";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import Battery from "../../components/bins/Battary";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useBins } from "@/hooks/bins/useBins";
import { getVariant } from "@/utils/binHelpers";



function BinsList() {
    const { allBins, isLoadingBins, binsError } = useBins();


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
                return (
                    <Badge variant={getVariant(health)}
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
        <div className="p-10">
            <DataTable columns={columns} data={allBins} isLoading={isLoadingBins} error={binsError} title='bins list' />
        </div>
    )
}

export default BinsList
