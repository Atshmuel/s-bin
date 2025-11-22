import { Badge } from "@/components/ui/badge";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { useUsers } from "@/hooks/users/useUsers";
import { LinkIcon } from "lucide-react";


function UsersList() {
    const { users: usersList, isLoadingUsers, usersError } = useUsers()

    const columns = [
        {
            header: 'Role',
            accessorKey: 'role',
            cell: ({ row }) => {
                const role = row.original.role
                return <Badge variant={role}>{role}</Badge>
            }
        },
        {
            header: 'Name',
            accessorKey: 'name',
            enableSorting: true,
            cell: ({ row }) => {
                const id = row.original._id;          // raw row data
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
            header: 'Email',
            accessorKey: 'email',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.original.status
                return <Badge variant={status}>{status}</Badge>
            }
        },
        {
            header: 'manager',
            accessorKey: 'manager',
            cell: ({ row }) => {
                const managerId = row.original.manager;
                return (
                    managerId ? <Link className="flex gap-2 items-center capitalize"
                        to={`/users/${managerId}`}
                    >
                        <LinkIcon size={14} /> <span>View manager</span>
                    </Link> : <span className="capitalize">no manager found</span>

                );
            },
        },
        {
            header: 'settings',
            accessorKey: 'settingsId',
            cell: ({ row }) => {
                const settingsId = row.original.settingsId;
                return (
                    settingsId ?
                        <Link className="flex gap-2 items-center "
                            to={`/users/settings/${settingsId}`}
                        >
                            <LinkIcon size={14} /> <span>View settings</span>
                        </Link>
                        : null
                );
            },
        },
    ]

    return (
        <div className="p-10">
            <DataTable columns={columns} data={usersList ?? []} isLoading={isLoadingUsers} error={usersError} title='users list' />
        </div>
    )
}

export default UsersList
