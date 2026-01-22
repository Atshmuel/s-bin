import {
  Bell,
  ChevronsUpDown,
  LogOut,
  UserCog
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "./ui/badge"
import { NavLink } from "react-router-dom"
import { useLogout } from "@/hooks/users/auth/useLogout"
import { Spinner } from "./ui/spinner"
import { useTranslation } from "react-i18next"

export function NavAccount({
  account,
  isRight,
}) {
  const { isMobile } = useSidebar()
  const { logout, isLoggingOut } = useLogout()
  const { t } = useTranslation()
  const splitedName = account.name.split(' ')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${isRight ? 'flex flex-row-reverse' : ''}`}>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={account.avatar} alt={account.name} />
                <AvatarFallback className="rounded-lg uppercase">{splitedName[0][0]}{splitedName[1][0]}</AvatarFallback>
              </Avatar>
              <div className={`grid flex-1  text-sm leading-tight ${isRight ? 'text-left' : 'text-right'}`}>
                <span className="truncate font-semibold capitalize">{account.name}</span>
                <span className="truncate text-xs">{account.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className={`flex items-center gap-2 px-1 py-1.5 ${isRight ? 'text-left' : 'text-right flex-row-reverse'} text-sm`}>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={account.avatar} alt={account.name} />
                  <AvatarFallback className="rounded-lg uppercase">{splitedName[0][0]}{splitedName[1][0]}</AvatarFallback>
                </Avatar>
                <div className={`grid flex-1  text-sm leading-tight ${isRight ? 'text-left' : 'text-right'}`}>
                  <div className={`flex ${isRight ? '' : 'flex-row-reverse'}  items-center justify-between`}>
                    <span className={`truncate font-semibold capitalize ${isRight ? 'mr-2' : 'ml-2'}`}>{account.name}</span>
                    <Badge variant={account.role}>{t(`roles.${account.role}`)}</Badge>
                  </div>
                  <span className="truncate text-xs mt-2">{account.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <NavLink to="/account">
                <DropdownMenuItem isRight={isRight}>
                  <UserCog />
                  {t('profile')}
                </DropdownMenuItem>
              </NavLink>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem isRight={isRight} onClick={logout}>

              {isLoggingOut ? <Spinner /> : <><LogOut />
                {t('logout')}</>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
