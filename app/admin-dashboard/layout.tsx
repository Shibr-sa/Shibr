"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, FileText, Store, CreditCard, Settings, ChevronUp, User, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useCurrentUser } from "@/hooks/use-current-user"
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
  SidebarFooter,
} from "@/components/ui/sidebar"

const sidebarItems = [
  { title: "dashboard.home", href: "/admin-dashboard", icon: Home },
  { title: "dashboard.posts", href: "/admin-dashboard/posts", icon: FileText },
  { title: "dashboard.stores", href: "/admin-dashboard/stores", icon: Store },
  { title: "dashboard.payments", href: "/admin-dashboard/payments", icon: CreditCard },
  { title: "dashboard.settings", href: "/admin-dashboard/settings", icon: Settings },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t, direction } = useLanguage()
  const { user, getInitials } = useCurrentUser()

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${direction === "rtl" ? "font-cairo" : "font-inter"}`} dir={direction}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/admin-dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Image
                        src="/logo.svg"
                        alt="Shibr Logo"
                        width={20}
                        height={20}
                        className="size-5 brightness-0 invert"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">{t("common.shibr")}</span>
                      <span className="text-xs text-muted-foreground">{t("dashboard.admin")}</span>
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
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" className="w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.fullName} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user ? getInitials(user.fullName) : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5 text-start leading-none">
                        <span className="text-sm font-medium">
                          {user?.fullName || t("dashboard.user.name")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email || "admin@example.com"}
                        </span>
                      </div>
                      <ChevronUp className="ms-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    side="right" 
                    align="end" 
                    className="w-56"
                  >
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b bg-background flex items-center px-4">
            <SidebarTrigger />
            
            <div className="flex-1 flex items-center justify-end ms-4">
              <LanguageSwitcher />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}