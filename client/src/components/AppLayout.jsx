import { Outlet } from "react-router-dom";
import Sidenav from './Sidenav'
import HeaderNav from './HeaderNav'
function AppLayout() {
    return (
        <div className="grid h-screen grid-cols-[16rem_1fr] grid-rows-[auto_1fr]">
            <Sidenav />
            <HeaderNav />

            <main className="overflow-y-auto bg-gray-100 p-6">
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout
