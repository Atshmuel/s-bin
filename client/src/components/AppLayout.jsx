import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@radix-ui/react-dropdown-menu";

import { useView } from "@/contexts/toggleDarkMode";
import { Breakcrumbs } from "./Breadcrumbs";
import { Moon, SunMedium } from "lucide-react";
function AppLayout() {
    const { isDark, toggleView } = useView()
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="bg-background sticky top-0 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4  transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10 z-[99]">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-5 mr-2" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breakcrumbs />
                    </div>
                    {isDark ? <SunMedium onClick={toggleView} /> : <Moon onClick={toggleView} />}
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppLayout
