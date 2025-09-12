import { NavLink } from "react-router-dom"

function Sidenav() {
    return (
        <aside className="row-span-2 bg-gray-50 flex flex-col gap-10 p-5">
            <span className="self-center">Logo</span>
            <nav >
                <ul className="flex flex-col gap-5">
                    <li><NavLink to="dashboard">Dashboard</NavLink></li>
                    <li><NavLink to="account">Account</NavLink></li>
                    <li><NavLink to="users">Manage Users</NavLink></li>
                    <li><NavLink to="settings">Settings</NavLink></li>
                    <li><NavLink to="map">Map</NavLink></li>
                    <li><NavLink to="login">Login</NavLink></li>
                    <li><NavLink to="signup">Signup</NavLink></li>
                    <li><NavLink to="error">Error</NavLink></li>
                    <li><NavLink to="logout">Logout</NavLink></li>
                </ul>
            </nav >
        </aside >
    )
}

export default Sidenav
