import { Badge } from "@/components/ui/badge";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";

const usersList = [
    { _id: "67b0a1f4c91e4a23d114a001", name: 'Liam Carter', email: 'john123@gmail.com', address: "123 Main St", phone: "2568-4561", role: "admin", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a002", name: 'Maya Cohen', email: 'jane456@gmail.com', address: "123 Main St", phone: "2568-4561", role: "owner", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a003", name: 'Noah Daniels', email: 'alice987@gmail.com', address: '123 Main St', phone: "2568-4561", role: "technician", status: "pending" },
    { _id: "67b0a1f4c91e4a23d114a004", name: 'Ella Rosen', email: 'esddfdf@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a005", name: 'Adam Levy', email: 'esddfdf@gmail.com', address: '456 Oak Ave', phone: "2568-4561", role: "admin", status: "inactive" },
    { _id: "67b0a1f4c91e4a23d114a006", name: 'Sofia Klein', email: 'esddfdf@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a007", name: 'Ethan Weiss', email: 'esddfdf@gmail.com', address: '789 Pine Rd', phone: '555-1234', role: "technician", status: "suspended" },
    { _id: "67b0a1f4c91e4a23d114a008", name: 'Lior Azulay', email: 'esddfdf@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "pending" },
    { _id: "67b0a1f4c91e4a23d114a009", name: 'Daniel Mor', email: 'esddfdf@gmail.com', address: '321 Maple St', phone: "2568-4561", role: "admin", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a00a", name: 'Tamar Sasson', email: 'esddfdf@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "active" },

    { _id: "67b0a1f4c91e4a23d114a00b", name: 'Ronen Shalev', email: 'john456@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "inactive" },
    { _id: "67b0a1f4c91e4a23d114a00c", name: 'Moran Hadad', email: 'jane789@gmail.com', address: "123 Main St", phone: "2568-4561", role: "technician", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a00d", name: 'Isaac Brenner', email: 'alice555@gmail.com', address: '123 Main St', phone: "2568-4561", role: "admin", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a00e", name: 'Dana Keidar', email: 'bob22@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a00f", name: 'Ariel Shamir', email: 'charlie66@gmail.com', address: '456 Oak Ave', phone: "2568-4561", role: "user", status: "pending" },
    { _id: "67b0a1f4c91e4a23d114a010", name: 'Rivka Adler', email: 'eve77@gmail.com', address: "123 Main St", phone: "2568-4561", role: "admin", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a011", name: 'Omer Nave', email: 'frank987@gmail.com', address: '789 Pine Rd', phone: '555-1234', role: "technician", status: "inactive" },
    { _id: "67b0a1f4c91e4a23d114a012", name: 'Shira Rahamim', email: 'grace333@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "suspended" },
    { _id: "67b0a1f4c91e4a23d114a013", name: 'Elad Moyal', email: 'hank999@gmail.com', address: '321 shmuel St', phone: "2568-4561", role: "technician", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a014", name: 'Talia Peretz', email: 'ivy123@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "pending" },

    { _id: "67b0a1f4c91e4a23d114a015", name: 'Jonathan Barak', email: 'john999@gmail.com', address: "123 Main St", phone: "2568-4561", role: "admin", status: "suspended" },
    { _id: "67b0a1f4c91e4a23d114a016", name: 'Orly Ben David', email: 'jane222@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "inactive" },
    { _id: "67b0a1f4c91e4a23d114a017", name: 'Gil Sharabi', email: 'alice222@gmail.com', address: '123 Main St', phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a018", name: 'Naomi Sivan', email: 'bob333@gmail.com', address: "123 Main St", phone: "2568-4561", role: "technician", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a019", name: 'Michael Tal', email: 'charlie444@gmail.com', address: '456 Oak Ave', phone: "2568-4561", role: "admin", status: "inactive" },
    { _id: "67b0a1f4c91e4a23d114a01a", name: 'Yael Amar', email: 'eve555@gmail.com', address: "123 Main St", phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a01b", name: 'Ron Avital', email: 'frank444@gmail.com', address: '789 Pine Rd', phone: '555-1234', role: "technician", status: "pending" },
    { _id: "67b0a1f4c91e4a23d114a01c", name: 'Hadass Levy', email: 'grace555@gmail.com', address: "123 Main St", phone: "2568-4561", role: "admin", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a01d", name: 'Nadav Regev', email: 'hank222@gmail.com', address: '321 Maple St', phone: "2568-4561", role: "user", status: "active" },
    { _id: "67b0a1f4c91e4a23d114a01e", name: 'Liad Sharvit', email: 'ivy777@gmail.com', address: "123 Main St", phone: "2568-4561", role: "technician", status: "suspended" }
];



function UsersList() {
    //page can be either table or cards (toggle) table should be inside of card and should have a search option
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
                    <Link className="flex gap-2 items-center "
                        to={`/users/${id}`}
                    >
                        {row.original.name}
                    </Link>
                );
            },
        },
        {
            header: 'Email',
            accessorKey: 'email',
        },

        {
            header: 'Address',
            accessorKey: 'address',
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
        }, {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.original.status
                return <Badge variant={status}>{status}</Badge>
            }
        },
    ]

    return (

        <DataTable columns={columns} data={usersList} title='users list' />
    )
}

export default UsersList
