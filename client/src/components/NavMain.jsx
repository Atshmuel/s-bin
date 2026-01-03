import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router-dom";
import { useMe } from "@/hooks/users/auth/useMe";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";

export function NavMain({
  items,
}) {
  const { me, isAdmin } = useMe();
  const { isRight } = useAppSide();
  const { t } = useTranslation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("sidebar.managment.title")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          item?.isOwnerOnly && me.role !== 'owner' || item?.isAdminAndAbove && !isAdmin ? null :
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {isRight ?
                      <ChevronRight
                        className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      :
                      <ChevronLeft
                        className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90" />
                    }
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      subItem?.isOwnerOnly && me.role !== 'owner' || subItem?.isAdminAndAbove && !isAdmin ? null :
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink to={`${item.url}/${subItem.url}`}>
                              <span>{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
