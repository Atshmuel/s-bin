"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router-dom";

export function NavGeneral({
  general
}) {

  return (
    <SidebarGroup className="group/collapsible">
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenu>
        {general.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <NavLink to={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

      </SidebarMenu>
    </SidebarGroup>
  );
}
