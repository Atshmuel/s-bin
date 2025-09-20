import { Outlet } from "react-router-dom";
import Sidenav from './Sidenav'
import HeaderNav from './HeaderNav'
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { useView } from "@/contexts/toggleDarkMood";
import SwitchItem from "./SwitchItem";
function AppLayout() {
    const { isDark, toggleView } = useView()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="bg-background sticky top-0 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4  transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Building Your Application
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <SwitchItem checked={isDark}
                        onCheckedChange={toggleView} id={'Toggle Theme'} toolTip={true} label={'Toggle Theme'} toolTipClassName={'glossy-tooltip'} switchClassName={'scale-90'} />
                </header>
                <div className="flex flex-1 flex-col gap-4 p-3">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppLayout
