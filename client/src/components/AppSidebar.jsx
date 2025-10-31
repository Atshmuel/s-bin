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
import { Button } from "./ui/button"
import NewEntitySheet from "./newEntityComponents/NewEntitySheet"

const data = {
  account: { //should come from user context
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
    role: "owner",
  },
  listItems: [
    {
      title: "Bins",
      url: "/bins",
      icon: Trash2Icon,
      // isActive: true,
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
    {
      title: "Dev only!",
      url: "",
      isActive: true,
      icon: Code2,
      items: [
        {
          title: "Error",
          url: "error",
        },
        {
          title: "Login",
          url: "login",
        },
        {
          title: "Signup",
          url: "signup",
        },
        {
          title: "Forgot password",
          url: "forgot-password",
        },
        {
          title: "Account",
          url: "account",
        },
        {
          title: "Owner - Users List",
          url: "management/users",
        },
        {
          title: "Owner - Bins List",
          url: "management/bins",
        },
        {
          title: "Specific Bin Log",
          url: "bins/logs/:id"
        },
        {
          title: "User profile view",
          url: "users/:id"
        }
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
        <NewEntitySheet isExpanded={isExpanded} />
        <NavAccount account={data.account} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
