import { Badge } from "@/components/ui/badge";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { useUsers } from "@/hooks/users/useUsers";
import { LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";


function UsersList() {
    const { users: usersList, isLoadingUsers, usersError } = useUsers()
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

    return (
        <div className="sm:p-10">
            <DataTable columns={columns} data={usersList ?? []} isLoading={isLoadingUsers} error={usersError} title={t('pages.userList.title')} />
        </div>
    )
}

export default UsersList
