import DataTable from "@/components/DataTable"
import { Badge } from "@/components/ui/badge";
import Battery from "@/components/bins/Battary";
import { format } from "date-fns";
import { getVariant } from "@/utils/binHelpers";
import { Link } from "react-router-dom";
import { LinkIcon } from "lucide-react";
import { useLogs } from "@/hooks/bins/binLogs/useBinLogs";
import { useTranslation } from "react-i18next";

function AllLogs() {
    const { t } = useTranslation();
    const { allLogs, isLoadingLogs, logsError } = useLogs()
    const columns = [
        {
            header: t('pages.logList.columns.createAt'),
            accessorKey: 'Created At',
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
            },
            enableSorting: true,
        },
        {
            header: t('pages.logList.columns.severity'),
            accessorKey: 'Severity',
            cell: ({ row }) => {
                const severity = row.original.severity;
                return (
                    <Badge variant={getVariant(severity)}
                    >
                        {t(`severities.${severity.toLowerCase()}`)}
                    </Badge>
                );
            }
        },
        {
            header: t('pages.logList.columns.fillLevel'),
            id: 'Fill level',
            accessorKey: 'newLevel',
            cell: ({ row }) => {
                return `${row.original.newLevel}%`
            }
        },
        {
            header: t('pages.logList.columns.batteryLevel'),
            accessorKey: 'Battery',
            cell: ({ row }) => {
                return <Battery level={row.original.battery} />
            }
        },
        {
            header: t('pages.logList.columns.healthStatus'),
            id: 'Health',
            cell: ({ row }) => {
                const health = row.original.health;
                return (
                    <Badge variant={getVariant(health)}
                    >
                        {t(`levels.${health.toLowerCase()}`)}
                    </Badge>
                );
            },
        },
        {
            header: t('pages.logList.columns.source'),
            id: 'Source',
            accessorKey: 'source',
            cell: ({ row }) => {
                return t(`pages.logList.${row.original.source.toLowerCase()}`);
            }
        },
        {
            header: t('pages.logList.columns.viewLog'),
            id: 'View log',
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center "
                        to={`/bins/logs/${id}`}
                    >
                        <LinkIcon size={14} /> <span>{t('pages.logList.columns.viewLog')}</span>
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
