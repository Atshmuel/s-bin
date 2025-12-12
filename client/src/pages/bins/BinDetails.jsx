import BinCard from "@/components/bins/BinCard"
import DataTable from "@/components/DataTable"
import Battery from "../../components/bins/Battary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getVariant } from "@/utils/binHelpers"
import { useBin } from "@/hooks/bins/useBin"
import { Link, useParams } from "react-router-dom"
import { LinkIcon } from "lucide-react"

function BinDetails() {

    const { id } = useParams()

    const { bin, isLoadingBins, binsError } = useBin(id)

    const logsColumns = [
        {
            header: 'created at',
            accessorKey: 'createdAt',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
        },
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
            header: 'fill level',
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
                return <Battery level={row.original.battery} />
            }
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
        <div className="flex flex-wrap gap-4">
            <BinCard className='flex-1 min-w-xs flex-col justify-between' bin={bin} isLoading={isLoadingBins} />
            <Card className='flex-2  min-w-xs md:min-w-md'>
                <CardHeader>
                    <h3 className="text-xl md:text-2xl"></h3>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        Logs Overview
                    </CardTitle>
                    <CardDescription>Review detailed records of all bin activities, including fill levels, timestamps, and event types.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={logsColumns} isLoading={isLoadingBins} data={bin?.logs ?? []} maxLength={4} error={binsError} sortingBy={[{ id: 'createdAt', desc: true }]} />
                </CardContent>
            </Card>
        </div>
    )
}

export default BinDetails
