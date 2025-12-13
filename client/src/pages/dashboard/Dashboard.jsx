import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleAlert, GaugeCircle, InfoIcon, LinkIcon, Trash2 } from "lucide-react"
import BinMap from "../bins/BinMap"
import DataTable from "@/components/DataTable"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import Battery from '../../components/bins/Battary'
import { getVariant } from "@/utils/binHelpers"
import { useOverviews } from "@/hooks/overviews/useOverviews"
import { Skeleton } from "@/components/ui/skeleton"
import ErrorPage from "../generals/ErrorPage"

function Dashboard() {
    const { data, isLoadingOverviews, overviewsError } = useOverviews()

    const attentionBinsColums = [
        {
            header: 'Bin name',
            accessorKey: 'binName',
            id: 'Bin name',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/${id}`}
                    >
                        {row.original.binName}
                    </Link>
                );
            },
            enableSorting: true,
        },
        {
            header: 'fill level',
            accessorKey: 'status.level',
            id: 'Fill level',
            cell: ({ row }) => {
                return row.original.status.level + '%'
            }
        },
        {
            header: 'Health',
            accessorKey: 'status.health',
            id: 'Health',
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
            id: 'Battery',
            cell: ({ row }) => {
                return <Battery level={row.original.status.battery} />
            }
        },
        {
            header: 'Last Updated',
            accessorKey: 'updatedAt',
            id: 'Last Updated',
            cell: ({ row }) => {
                return format(new Date(row.original.updatedAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]

    const recentBinsColums = [
        {
            header: 'createdAt',
            accessorKey: 'createdAt',
            id: 'Created At',
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
            header: 'View log',
            accessorKey: '_id',
            id: 'View log',
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

        },
        {
            header: 'View bin',
            accessorKey: 'binId',
            id: 'View bin',
            cell: ({ row }) => {
                const id = row.original.binId;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/${id}`}
                    >
                        <LinkIcon size={14} /> <span>View bin</span>
                    </Link>
                );
            },

        },
    ]

    if (isLoadingOverviews) {
        return <div className="space-y-6">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className={'w-1/4 h-8'} />
                    <Skeleton className={'w-1/2 h-12'} />
                </div>
                <div className="flex gap-4 flex-col md:flex-row">
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                </div>
                <Skeleton className={'w-full h-96'} />
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className={'w-1/4 h-8'} />
                    <Skeleton className={'w-1/2 h-12'} />
                </div>
                <div className="flex gap-4 flex-col md:flex-row">
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                    <Skeleton className={'w-full md:w-1/4 h-46'} />
                </div>
                <Skeleton className={'w-full h-96'} />
            </div>
        </div>
    }
    if (!isLoadingOverviews && overviewsError) {
        return <ErrorPage />
    }

    const cardsData = [{
        title: 'Bins Requiring Maintenance',
        count: data.totalRequiringMaintenance,
        description: 'Required maintenance immediately',
        badgeVariant: 'suspended',
        icon: CircleAlert
    }, {
        title: 'Almost Full Bins',
        count: data.totalAlmostFullBins,
        description: 'Check these bins for emptying today',
        badgeVariant: 'inactive',
        icon: InfoIcon
    }, {
        title: 'Total Bins',
        count: data.totalBins,
        description: 'Total number of bins in the system',
        badgeVariant: 'outline',
        icon: Trash2
    }
        , {
        title: 'Avg Fill Level',
        count: data.averageFillLevel + "%",
        description: 'Average fill level across all bins',
        badgeVariant: 'outline',
        icon: GaugeCircle
    }]


    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl">Quick Overview</h3>
                    <p className="text-sm text-muted-foreground">
                        Key metrics for your bins at a glance, including fill levels, total bins, and maintenance needs.
                    </p>
                </div>
                <div className="lg:flex gap-4">
                    <div className="flex mb-4 lg:mb-0 lg:w-1/2 flex-wrap gap-4">
                        {cardsData.map((card, index) => (
                            <Card key={index} className="min-w-72 flex-1">
                                <CardHeader className="flex flex-row items-start justify-between gap-3">
                                    <div>

                                        <CardDescription>{card.title}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                            {card.count}
                                        </CardTitle>
                                    </div>
                                    <Badge variant={card.badgeVariant} className={'p-1'}>
                                        <card.icon size={16} />
                                    </Badge>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                    <div className="line-clamp-1 flex gap-2 font-medium">
                                        {card.description}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    <div className="h-[250px] lg:h-auto lg:w-1/2">
                        <BinMap binsToUse={data.criticalBins} zoom={13} legend={true} legendForm={false} />
                    </div>
                </div>


            </div >




            <div className="space-y-4">
                <div>
                    <h3 className="text-xl md:text-2xl">Bins Overview</h3>
                    <p className="text-sm text-muted-foreground">
                        A detailed view of current bin alerts and recent activity logs across the system
                    </p>
                </div>
                <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-row lg:flex-wrap gap-6">
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                Bins Requiring Attention
                            </CardTitle>
                            <CardDescription>List of bins that have triggered alerts or need maintenance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={data.requiringAttentionBins
                                ?? []} columns={attentionBinsColums} maxLength={5} error={null} isLoading={false} />
                        </CardContent>
                    </Card>
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                Recent Bin Logs
                            </CardTitle>
                            <CardDescription>A summary of bin-related actions, maintenance, and events from the past 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={data.recentBinLogs ?? []} columns={recentBinsColums} maxLength={5} error={null} isLoading={false} />
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>

    )
}

export default Dashboard
