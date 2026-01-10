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
import { useAppSide } from "@/contexts/AppSideProvider"
import { useTranslation } from "react-i18next"



export function AppSidebar({
  ...props
}) {
  const { t } = useTranslation()

  const data = {
    listItems: [
      {
        title: t("sidebar.managment.subtitles.bins"),
        url: "/bins",
        icon: Trash2Icon,
        isActive: true,
        items: [
          {
            title: t("sidebar.managment.items.addBin"),
            url: "add",
          },
          {
            title: t("sidebar.managment.items.binList"),
            url: "",
          },
          {
            title: t("sidebar.managment.items.map"),
            url: "map",
          },
          {
            title: t("sidebar.managment.items.logs"),
            url: "logs",
          },
        ],
      },
      {
        title: t("sidebar.managment.subtitles.users"),
        url: "/users",
        icon: UserCircle2Icon,
        isAdminAndAbove: true,
        items: [
          {
            title: t("sidebar.managment.items.userList"),
            url: "",
          },
        ],
      },
      {
        title: t("sidebar.managment.subtitles.organizations"),
        url: "/organizations",
        icon: UserCircle2Icon,
        isOwnerOnly: true,
        items: [
          {
            title: t("sidebar.managment.items.organizationList"),
            url: "",
          },
        ],
      },
    ],
    general: [
      {
        name: t("sidebar.general.items.dashboard"),
        url: "/dashboard",
        icon: LayoutDashboardIcon,
      },
      {
        name: t("sidebar.general.items.analytics"),
        url: "/analytics",
        icon: ChartSplineIcon,
      }
    ],
  }

  const { state } = useSidebar()
  const { me, isAdmin } = useMe()
  const { opSide, isRight } = useAppSide()

  const isExpanded = state === 'expanded'

  return (
    <Sidebar side={opSide} collapsible="icon" {...props}>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.listItems} />
        <NavGeneral general={data.general} />
      </SidebarContent>
      <SidebarFooter>
        {isAdmin ? <NewEntitySheet isExpanded={isExpanded} /> : null}
        <NavAccount isRight={isRight} account={{ ...me, avater: '/avatars/shadcn.jpg' }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
