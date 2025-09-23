"use client"

import * as React from "react"
import {
  BarChart3,
  ChartSplineIcon,
  Code2,
  HelpCircleIcon,
  LayoutDashboard,
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
} from "@/components/ui/sidebar"

const data = {
  account: { //should come from user context
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  listItems: [
    {
      title: "Bins",
      url: "/bins",
      icon: Trash2Icon,
      // isActive: true,
      items: [
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
          url: "list",
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
          title: "Account Settings",
          url: "account/settings",
        },
        {
          title: "Owner - Create Bin",
          url: "owner/new/bin",
        },
        {
          title: "Owner - Create User",
          url: "owner/new/user",
        },
        {
          title: "Owner - Users List",
          url: "owner/users",
        },
        {
          title: "Owner - User Management",
          url: "owner/users/1",
        },
        { title: "Bin Logs", url: "bins/logs/bin/:id" },
        { title: "Specific Bin Log", url: "bins/logs/:id" }
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
      name: "App Settings",
      url: "/settings",
      icon: Settings2,
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
        <NavAccount account={data.account} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
