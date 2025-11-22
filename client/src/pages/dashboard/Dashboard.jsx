import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleAlert, GaugeCircle, InfoIcon, LinkIcon, Trash2 } from "lucide-react"
import BinMap from "../bins/BinMap"
import DataTable from "@/components/DataTable"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import Battery from '../../components/bins/Battary'
import { getVariant } from "@/utils/binHelpers"

function Dashboard() {
    //come from the server
    const cardsData = [{
        title: 'Bins Requiring Maintenance',
        count: 7,
        description: 'Required maintenance immediately',
        badgeVariant: 'suspended',
        icon: CircleAlert
    }, {
        title: 'Almost Full Bins',
        count: 7,
        description: 'Check these bins for emptying today',
        badgeVariant: 'inactive',
        icon: InfoIcon
    }, {
        title: 'Total Bins',
        count: 50,
        description: 'Total number of bins in the system',
        badgeVariant: 'outline',
        icon: Trash2
    }
        , {
        title: 'Avg Fill Level',
        count: "65%",
        description: 'Average fill level across all bins',
        badgeVariant: 'outline',
        icon: GaugeCircle
    }]

    const binsNeedingAttention = [
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
        }
    ];
    const attentionBinsColums = [
        {
            header: 'Bin name',
            accessorKey: 'binName',
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
        },
        {
            header: 'Health',
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
            header: 'Last Updated',
            accessorKey: 'updatedAt',
            cell: ({ row }) => {
                return format(new Date(row.original.updatedAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]


    const recentBinLogs = [
        {
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
        }
    ];
    const recentBinsColums = [
        {
            header: 'createdAt',
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

        },
        {
            header: 'View bin',
            accessorKey: 'binId',
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
    //map should display only bins with issues not all the bins!

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
                        <BinMap zoom={13} legend={true} legendForm={false} />
                    </div>
                </div>


            </div >




            <div className="space-y-4">
                <div>
                    <h3 className="text-xl md:text-2xl">Bins Overview</h3>
                    <p className="text-sm text-muted-foreground">
                        A detailed view of current bin alerts and recent activity logs across the system                    </p>
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
                            <DataTable data={binsNeedingAttention
                                ?? []} columns={attentionBinsColums} maxLength={5} error={null} isLoading={false} />
                        </CardContent>
                    </Card>
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                Recent Bin Logs
                            </CardTitle>
                            <CardDescription>A summary of the most recent actions, maintenance, or events related to your bins.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={recentBinLogs ?? []} columns={recentBinsColums} maxLength={5} error={null} isLoading={false} />
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>

    )
}

export default Dashboard
