import { NavLink } from "react-router-dom"

function Sidenav() {
    return (
        <aside className="row-span-2 bg-gray-50 flex flex-col gap-10 p-5">
            <span className="self-center">Logo</span>
            <nav >
                <ul className="flex flex-col gap-5">
                    <NavLink to={'dashboard'}> <li>Dashboard</li></NavLink>
                    <NavLink to={'account'}> <li>Account</li></NavLink>
                    <NavLink to={'users'}> <li>Manage Users</li></NavLink>
                    <NavLink to={'settings'}> <li>Settings</li></NavLink>
                    {/* will be in the dashboard */}
                    <NavLink to={'map'}> <li>Map</li></NavLink>


                    {/* will be in the in outside layout */}
                    <NavLink to={'login'}> <li>Login</li></NavLink>
                    <NavLink to={'signup'}> <li>Signup</li></NavLink>
                    <NavLink to={'error'}> <li>Error</li></NavLink>
                </ul>
            </nav >
        </aside >
    )
}

export default Sidenav
