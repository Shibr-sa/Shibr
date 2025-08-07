"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Package, ShoppingCart, Settings, ChevronUp, User, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { BrandDataProvider } from "@/contexts/brand-data-context"
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
  { title: "dashboard.home", href: "/brand-dashboard", icon: Home },
  { title: "dashboard.shelves", href: "/brand-dashboard/shelves", icon: ShoppingCart },
  { title: "dashboard.products", href: "/brand-dashboard/products", icon: Package },
  { title: "dashboard.settings", href: "/brand-dashboard/settings", icon: Settings },
]

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, direction } = useLanguage()
  const { user, getInitials } = useCurrentUser()

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("currentUser")
    // Clear any remembered email
    localStorage.removeItem("userEmail")
    // Redirect to sign in page
    router.push("/signin")
  }

  return (
    <BrandDataProvider>
      <SidebarProvider>
        <div className={`min-h-screen flex w-full ${direction === "rtl" ? "font-cairo" : "font-inter"}`} dir={direction}>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link href="/brand-dashboard">
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
                        <span className="text-xs text-muted-foreground">{t("dashboard.brand")}</span>
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
                            {user ? getInitials() : "BR"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5 text-start leading-none">
                          <span className="text-sm font-medium">
                            {user?.fullName || t("dashboard.user.name")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user?.email || "brand@example.com"}
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
                      <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                        <LogOut className="me-2 h-4 w-4" />
                        <span>{t("dashboard.logout")}</span>
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
            <main className="flex-1 p-6 bg-background" dir={direction}>{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </BrandDataProvider>
  )
}