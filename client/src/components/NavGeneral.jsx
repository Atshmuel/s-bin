"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useMe } from "@/hooks/users/auth/useMe";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export function NavGeneral({
  general
}) {
  const { me, isAdmin } = useMe();
  const { t } = useTranslation();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <SidebarGroup className="group/collapsible">
      <SidebarGroupLabel>{t("sidebar.general.title")}</SidebarGroupLabel>
      <SidebarMenu>
        {general.map((item) => (
          item?.isOwnerOnly && me.role !== 'owner' || item?.isAdminAndAbove && !isAdmin ? null : (
            <SidebarMenuItem key={item.name} onClick={() => isMobile && toggleSidebar()}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        ))}

      </SidebarMenu>
    </SidebarGroup>
  );
}
