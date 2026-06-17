"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartColumn,
  ChevronDown,
  Coffee,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Package,
  ReceiptText,
  ShoppingCart,
  SlidersHorizontal,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { logoutAction } from "@/actions/user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { APP_NAME, DASHBOARD_NAVIGATION } from "@/constants/constants"
import type { AccessMap } from "@/lib/access-control"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  user: {
    name: string
    email: string
    access: AccessMap
  }
  children: React.ReactNode
}

const navIconMap: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/menu": Coffee,
  "/dashboard/material": Package,
  "/dashboard/material/transaction": ReceiptText,
  "/dashboard/material/purchase": ShoppingCart,
  "/dashboard/material/adjustment": SlidersHorizontal,
  "/dashboard/customer": Users,
  "/dashboard/user": UserCog,
  "/dashboard/account": UserCircle,
  "/dashboard/order": ReceiptText,
  "/dashboard/order/point-of-sales": MonitorCog,
  "/dashboard/report": ChartColumn,
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const isAccountActive = isActivePath(pathname, "/dashboard/account")
  const navigation = useMemo(() => {
    return DASHBOARD_NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter((item) => user.access[item.access]),
    })).filter((section) => section.items.length > 0)
  }, [user.access])

  const initialGroupOpenState = useMemo(() => {
    return Object.fromEntries(
      navigation.filter((section) => section.items.length > 1).map((section) => [section.title, true])
    )
  }, [navigation])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialGroupOpenState)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-zinc-200 bg-white">
        <SidebarHeader className="gap-0 border-b border-zinc-200 px-3 py-3">
          <p className="px-2 text-xs font-medium tracking-[0.16em] text-zinc-500 uppercase">Dashboard</p>
          <p className="px-2 pt-1 text-base font-semibold text-zinc-900 group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </p>
        </SidebarHeader>

        <SidebarContent className="gap-2 px-2 py-3">
          {navigation.map((section) => {
            const hasMultipleItems = section.items.length > 1

            if (hasMultipleItems) {
              const isSectionOpen = openGroups[section.title] ?? true

              return (
                <Collapsible
                  key={section.title}
                  open={isSectionOpen}
                  onOpenChange={(nextOpen) => {
                    setOpenGroups((previous) => ({ ...previous, [section.title]: nextOpen }))
                  }}
                >
                  <SidebarGroup className="p-0">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold tracking-[0.1em] text-zinc-500 uppercase hover:bg-zinc-100 group-data-[collapsible=icon]:hidden"
                      >
                        <span>{section.title}</span>
                        <ChevronDown
                          className={cn("size-4 transition-transform", !isSectionOpen && "-rotate-90")}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {section.items.map((item) => {
                            const Icon = navIconMap[item.href] ?? LayoutDashboard
                            const active = isActivePath(pathname, item.href)

                            return (
                              <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                                  <Link href={item.href}>
                                    <Icon className="size-4" />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              )
            }

            return (
              <SidebarGroup key={section.title} className="p-0">
                <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-[0.1em] text-zinc-500 uppercase">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = navIconMap[item.href] ?? LayoutDashboard
                      const active = isActivePath(pathname, item.href)

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                            <Link href={item.href}>
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="gap-2 p-3">
          <div className="rounded-lg bg-zinc-100 px-3 py-2 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-600">{user.email}</p>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isAccountActive} tooltip="Akun Saya">
                <Link href="/dashboard/account">
                  <UserCircle className="size-4" />
                  <span>Akun Saya</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action={logoutAction}>
                <SidebarMenuButton asChild tooltip="Keluar">
                  <button type="submit" className="text-red-600 hover:text-red-700">
                    <LogOut className="size-4" />
                    <span>Keluar</span>
                  </button>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
            <SidebarTrigger />
            <div>
              <p className="text-sm font-semibold text-zinc-900">{APP_NAME}</p>
              <p className="text-xs text-zinc-500">Sistem Manajemen Coffee Shop</p>
            </div>
          </header>

          <div className="min-w-0 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
