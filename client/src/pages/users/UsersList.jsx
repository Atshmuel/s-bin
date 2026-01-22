import { Badge } from "@/components/ui/badge";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { useUsers } from "@/hooks/users/useUsers";
import { useMe } from "@/hooks/users/auth/useMe";
import { useOrganizations } from "@/hooks/organizations/useOrganizations";
import { LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";


function UsersList() {
    const { users: usersList, isLoadingUsers, usersError } = useUsers()
    const { data: organizations } = useOrganizations();
    const { isOwner } = useMe();
    const { t } = useTranslation()
    const columns = [
        {
            header: t('pages.userList.columns.role'),
            accessorKey: 'role',
            cell: ({ row }) => {
                const role = row.original.role
                return <Badge variant={role}>{t(`roles.${role}`)}</Badge>
            }
        },
        {
            header: t('pages.userList.columns.fullName'),
            accessorKey: 'name',
            enableSorting: true,
            cell: ({ row }) => {
                const id = row.original._id;
                return (
                    <Link className="flex gap-2 items-center capitalize"
                        to={`/users/${id}`}
                    >
                        <LinkIcon size={14} /> <span>{row.original.name}</span>
                    </Link>
                );
            },
        },
        {
            header: t('pages.userList.columns.email'),
            accessorKey: 'email',
        },
        {
            header: t('pages.userList.columns.accountStatus'),
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.original.status
                return <Badge variant={status}>{t(`statuses.${status}`)}</Badge>
            }
        },
        {
            header: t('pages.userList.columns.manager'),
            accessorKey: 'manager',
            cell: ({ row }) => {
                const managerId = row.original.manager;
                return (
                    managerId ? <Link className="flex gap-2 items-center capitalize"
                        to={`/users/${managerId}`}
                    >
                        <LinkIcon size={14} /> <span>{t('pages.userList.viewManager')}</span>
                    </Link> : <span className="capitalize text-muted-foreground/50">{t('pages.userList.managerNotAssigned')}</span>

                );
            },
        },

    ]

    const orgColumn = {
        header: t('pages.userList.columns.organization'),
        accessorKey: 'org',
        cell: ({ row }) => {
            const orgId = row.original.org;
            const org = organizations?.find(o => o._id === orgId);
            return (
                <Link className="flex gap-2 items-center capitalize"
                    to={`/organizations?id=${orgId}`}
                >
                    <span className={`${!org ? 'capitalize text-muted-foreground/50' : ''}`} >{org ?
                        (<><LinkIcon size={14} className="inline mr-1" /> {org.name}</>) : 'N/A'}</span>
                </Link>

            );
        },
    }
    if (isOwner) {
        columns.splice(1, 0, orgColumn);
    }

    return (
        <div className="sm:p-10">
            <DataTable columns={columns} data={usersList ?? []} isLoading={isLoadingUsers} error={usersError} title={t('pages.userList.title')} />
        </div>
    )
}

export default UsersList
