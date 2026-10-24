import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DataTable from "../../components/DataTable"
import { useOrganizations } from "@/hooks/organizations/useOrganizations";
import { getOverviewSection } from "@/services/apiAnalytics";
import { formatReportSchedule } from "@/utils/orgSettings";
import { DEFAULT_REPORT_INTERVAL_MINUTES, DEFAULT_REPORT_START_HOUR } from "@/utils/constants";

// The owner's overview of every organization: its devices' state and its
// reporting schedule. A name opens the organization's page, where it is
// renamed, set up or deleted.
function OrganizationsList() {
    const { t, i18n } = useTranslation();
    const { data: organizations, isLoadingOrgs, orgsError } = useOrganizations()
    // Every organization's numbers (the dashboard's Organizations card), not
    // narrowed to the organization picked on the dashboard.
    const statsQuery = useQuery({
        queryKey: ["organizations-overview"],
        queryFn: () => getOverviewSection({ section: "organizations" }),
    })
    const stats = new Map((statsQuery.data?.organizations ?? []).map(row => [row._id, row]))
    const rows = (organizations ?? []).map(org => ({ ...org, ...stats.get(org._id) }))

    const count = (key) => ({
        header: t(`pages.dashboard.tables.organizations.columns.${key}`),
        accessorKey: key,
        enableSorting: true,
        cell: ({ row }) => <span className="tabular-nums">{row.original[key] ?? "-"}</span>,
    })
    const columns = [
        {
            header: t('pages.organizationsList.columns.orgName'),
            accessorKey: 'name',
            enableSorting: true,
            cell: ({ row }) => (
                <Link className="font-medium text-primary underline-offset-4 hover:underline" to={`/organizations/${row.original._id}/settings`}>
                    {row.original.name}
                </Link>
            ),
        },
        count("bins"),
        count("gateways"),
        count("needsAttention"),
        count("offline"),
        count("almostFull"),
        {
            header: t("pages.dashboard.tables.organizations.columns.averageFullness"),
            accessorKey: "averageFullness",
            enableSorting: true,
            cell: ({ row }) => row.original.averageFullness == null ? "-" : `${row.original.averageFullness}%`,
        },
        {
            header: t("components.orgSettingsPage.nav.reporting"),
            id: "reporting",
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatReportSchedule(row.original.reportIntervalMinutes ?? DEFAULT_REPORT_INTERVAL_MINUTES,
                        row.original.reportStartHour ?? DEFAULT_REPORT_START_HOUR, t, i18n.language)}
                </span>
            ),
        },
    ]

    return (
        <div className="sm:p-10">
            <DataTable columns={columns} data={rows} isLoading={isLoadingOrgs} error={orgsError} title={t('pages.organizationsList.title')} />
        </div>
    )
}

export default OrganizationsList
