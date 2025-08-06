"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Package, ShoppingCart, Settings, ChevronDown, User, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const sidebarItems = [
  { title: "dashboard.home", href: "/store-dashboard", icon: Home },
  { title: "dashboard.shelves", href: "/store-dashboard/shelves", icon: Package },
  { title: "dashboard.orders", href: "/store-dashboard/orders", icon: ShoppingCart },
  { title: "dashboard.settings", href: "/store-dashboard/settings", icon: Settings },
]

export default function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t, direction } = useLanguage()

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${direction === "rtl" ? "font-cairo" : "font-inter"}`} dir={direction}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/store-dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Image
                        src="/logo.svg"
                        alt="Shibr Logo"
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">{t("common.shibr")}</span>
                      <span className="text-xs text-muted-foreground">{t("dashboard.store")}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={t(item.title)}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b bg-background flex items-center px-4">
            <SidebarTrigger />
            
            <div className="flex-1 flex items-center justify-end ms-4">
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline">{t("dashboard.user.name")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <User className="me-2 h-4 w-4" />
                      <span>{t("dashboard.user.profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="me-2 h-4 w-4" />
                      <span>{t("dashboard.user.settings")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <LogOut className="me-2 h-4 w-4" />
                      <span>{t("dashboard.user.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}