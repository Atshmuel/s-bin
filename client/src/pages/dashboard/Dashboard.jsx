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
import { useTranslation } from 'react-i18next';

import ErrorPage from "../generals/ErrorPage"

function Dashboard() {
    const { data, isLoadingOverviews, overviewsError } = useOverviews()
    const { t } = useTranslation();
    const attentionBinsColums = [
        {
            header: t('pages.dashboard.tables.recentLogs.columns.binName'),
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
            header: t('pages.dashboard.tables.recentLogs.columns.fillLevel'),
            accessorKey: 'status.level',
            id: 'Fill level',
            cell: ({ row }) => {
                return row.original.status.level + '%'
            }
        },
        {
            header: t('pages.dashboard.tables.recentLogs.columns.healthStatus'),
            accessorKey: 'status.health',
            id: 'Health',
            cell: ({ row }) => {
                const health = row.original.status.health;
                const variant = health === 'warning' ? 'pending' : health === 'critical' ? 'suspended' : 'default';
                return (
                    <Badge variant={variant}
                    >
                        {t(`levels.${health}`)}
                    </Badge>
                );
            },

        },

        {
            header: t('pages.dashboard.tables.recentLogs.columns.batteryLevel'),
            accessorKey: 'status.battery',
            id: 'Battery',
            cell: ({ row }) => {
                return <Battery level={row.original.status.battery} />
            }
        },
        {
            header: t('pages.dashboard.tables.recentLogs.columns.lastUpdated'),
            accessorKey: 'updatedAt',
            id: 'Last Updated',
            cell: ({ row }) => {
                return format(new Date(row.original.updatedAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]

    const recentBinsColums = [
        {
            header: t('pages.dashboard.tables.topFilledBins.columns.createdAt'),
            accessorKey: 'createdAt',
            id: 'Created At',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
            enableSorting: true,

        },

        {
            header: t('pages.dashboard.tables.topFilledBins.columns.type'),
            accessorKey: 'type',
            cell: ({ row }) => {
                return t(`types.${row.original.type.toLowerCase()}`);
            }
        },
        {
            header: t('pages.dashboard.tables.topFilledBins.columns.severity'),
            accessorKey: 'severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}
                    >
                        {t(`severities.${severity}`)}
                    </Badge>
                );
            }
        },
        {
            header: t('pages.dashboard.tables.topFilledBins.columns.viewLog'),
            accessorKey: '_id',
            id: 'View log',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/logs/${id}`}
                    >
                        <LinkIcon size={14} />
                        <span>{t('pages.dashboard.tables.topFilledBins.columns.viewLog')}</span>
                    </Link>
                );
            },

        },
        {
            header: t('pages.dashboard.tables.topFilledBins.columns.viewBin'),
            accessorKey: 'binId',
            id: 'View bin',
            cell: ({ row }) => {
                const id = row.original.binId;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/${id}`}
                    >
                        <LinkIcon size={14} /> <span>{t('pages.dashboard.tables.topFilledBins.columns.viewBin')}</span>
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
        title: t('pages.dashboard.cards.requiredMaintenance.title'),
        count: data.totalRequiringMaintenance,
        description: t('pages.dashboard.cards.requiredMaintenance.description'),
        badgeVariant: 'suspended',
        icon: CircleAlert
    }, {
        title: t('pages.dashboard.cards.almostFull.title'),
        count: data.totalAlmostFullBins,
        description: t('pages.dashboard.cards.almostFull.description'),
        badgeVariant: 'inactive',
        icon: InfoIcon
    }, {
        title: t('pages.dashboard.cards.totalBins.title'),
        count: data.totalBins,
        description: t('pages.dashboard.cards.totalBins.description'),
        badgeVariant: 'outline',
        icon: Trash2
    }
        , {
        title: t('pages.dashboard.cards.avgFillLevel.title'),
        count: data.averageFillLevel + "%",
        description: t('pages.dashboard.cards.avgFillLevel.description'),
        badgeVariant: 'outline',
        icon: GaugeCircle
    }]


    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl">{t('pages.dashboard.titles.quickOverview.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('pages.dashboard.titles.quickOverview.description')}
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
                    <h3 className="text-xl md:text-2xl">{t('pages.dashboard.titles.binOverview.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('pages.dashboard.titles.binOverview.description')}
                    </p>
                </div>
                <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-row lg:flex-wrap gap-6">
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {t('pages.dashboard.cards.requiredMaintenance.title')}
                            </CardTitle>
                            <CardDescription>{t('pages.dashboard.cards.requiredMaintenance.description')}</CardDescription>
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
                                {t('pages.dashboard.tables.recentLogs.title')}
                            </CardTitle>
                            <CardDescription>{t('pages.dashboard.tables.recentLogs.description')}</CardDescription>
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
