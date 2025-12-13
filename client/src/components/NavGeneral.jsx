"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useMe } from "@/hooks/users/auth/useMe";
import { NavLink } from "react-router-dom";

export function NavGeneral({
  general
}) {
  const { me, isAdmin } = useMe();

  return (
    <SidebarGroup className="group/collapsible">
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenu>
        {general.map((item) => (
          item?.isOwnerOnly && me.role !== 'owner' || item?.isAdminAndAbove && !isAdmin ? null : (
            <SidebarMenuItem key={item.name}>
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
