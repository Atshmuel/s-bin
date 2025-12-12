"use client"

import * as React from "react"
import {
  BarChart3,
  ChartSplineIcon,
  Code2,
  HelpCircleIcon,
  LayoutDashboardIcon,
  Settings2,
  Trash2Icon,
  UserCircle2Icon,
} from "lucide-react"

import { NavMain } from "@/components/NavMain"
import { NavGeneral } from "@/components/NavGeneral"
import { NavAccount } from "@/components/NavAccount"
import { AppLogo } from "@/components/AppLogo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import NewEntitySheet from "./newEntityComponents/NewEntitySheet"
import { useMe } from "@/hooks/users/auth/useMe"

const data = {
  listItems: [
    {
      title: "Bins",
      url: "/bins",
      icon: Trash2Icon,
      isActive: true,
      items: [
        {
          title: "Add",
          url: "add",
        },
        {
          title: "List",
          url: "",
        },
        {
          title: "Map",
          url: "map",
        },
        {
          title: "Logs",
          url: "logs",
        },
      ],
    },
    {
      title: "Users",
      url: "/users",
      icon: UserCircle2Icon,
      items: [
        {
          title: "List",
          url: "",
        },
      ],
    },
  ],
  general: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      name: "Analytics",
      url: "/analytics",
      icon: ChartSplineIcon,
    },
    {
      name: "Statistics",
      url: "/statistics",
      icon: BarChart3,
    },
    {
      name: "Support",
      url: "/support",
      icon: HelpCircleIcon,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const { state } = useSidebar()
  const { me, isAdmin } = useMe()


  const isExpanded = state === 'expanded'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.listItems} />
        <NavGeneral general={data.general} />
      </SidebarContent>
      <SidebarFooter>
        {isAdmin ? <NewEntitySheet isExpanded={isExpanded} /> : null}
        <NavAccount account={{ ...me, avater: '/avatars/shadcn.jpg' }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
