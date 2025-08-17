"use client"

import React, { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Home, Package, ShoppingCart, Settings, ChevronUp, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { StoreDataProvider, useStoreData } from "@/contexts/store-data-context"
import { ChatFabWidget } from "@/components/chat/chat-fab-widget"
import { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
  { title: "dashboard.home", href: "/store-dashboard", icon: Home, pageTitle: "dashboard.home" },
  { title: "dashboard.shelves", href: "/store-dashboard/shelves", icon: Package, pageTitle: "dashboard.shelves" },
  { title: "dashboard.orders", href: "/store-dashboard/orders", icon: ShoppingCart, pageTitle: "dashboard.orders" },
  { title: "dashboard.settings", href: "/store-dashboard/settings", icon: Settings, pageTitle: "dashboard.settings" },
]

// Inner component that uses the store data context
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, direction } = useLanguage()
  const { user, getInitials: getSessionInitials } = useCurrentUser()
  const { userData } = useStoreData()
  
  // Get userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null
  
  // Get total order-related notifications (including messages)
  const totalOrderNotifications = useQuery(
    api.notifications.getTotalOrderNotifications,
    userId ? { userId: userId } : "skip"
  ) || 0

  // Use userData from context if available, fallback to user from session
  const displayUser = userData || user

  const getInitials = () => {
    if (userData) {
      const name = userData.ownerName || userData.fullName || userData.storeName || "Store"
      const parts = name.split(" ")
      if (parts.length > 1) {
        return parts[0][0] + parts[1][0]
      }
      return name.substring(0, 2).toUpperCase()
    }
    return getSessionInitials()
  }

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("currentUser")
    // Clear any remembered email
    localStorage.removeItem("userEmail")
    // Redirect to sign in page
    router.push("/signin")
  }

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    const currentItem = sidebarItems.find(item => item.href === pathname)
    return currentItem ? t(currentItem.pageTitle) : t("dashboard.home")
  }

  // Generate breadcrumb items based on pathname
  const getBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    // Always start with dashboard home
    breadcrumbs.push({
      title: t("dashboard.store"),
      href: "/store-dashboard",
      isCurrentPage: pathname === "/store-dashboard"
    })
    
    // Add additional segments
    if (pathSegments.length > 1) {
      for (let i = 1; i < pathSegments.length; i++) {
        const href = `/${pathSegments.slice(0, i + 1).join('/')}`
        const segment = pathSegments[i]
        
        // Find matching sidebar item for main sections
        const sidebarItem = sidebarItems.find(item => item.href === href)
        
        // Determine the title
        let title = ""
        if (sidebarItem) {
          title = t(sidebarItem.title)
        } else {
          // Handle sub-pages
          switch(segment) {
            case 'add':
              title = t("common.add")
              break
            case 'new':
              title = t("common.new")
              break
            case 'edit':
              title = t("common.edit")
              break
            case 'details':
              title = t("common.details")
              break
            default:
              // For dynamic IDs, show "Details"
              if (segment.match(/^[a-zA-Z0-9]+$/)) {
                title = t("common.details")
              } else {
                title = segment.charAt(0).toUpperCase() + segment.slice(1)
              }
          }
        }
        
        breadcrumbs.push({
          title,
          href,
          isCurrentPage: i === pathSegments.length - 1
        })
      }
    }
    
    return breadcrumbs
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
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
                      className="size-5 brightness-0 invert"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{t("common.shibr")}</span>
                    <span className="text-xs">{t("dashboard.store")}</span>
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
                        <span className="flex-1">{t(item.title)}</span>
                        {item.href === "/store-dashboard/orders" && totalOrderNotifications > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-[20px] rounded-full px-1.5 text-[10px] animate-pulse"
                          >
                            {totalOrderNotifications}
                          </Badge>
                        )}
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
                      <AvatarImage src={displayUser?.profileImageUrl || displayUser?.avatar} alt={displayUser?.fullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {displayUser ? getInitials() : "ST"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 text-start leading-none">
                      <span className="text-sm font-medium">
                        {displayUser?.ownerName || displayUser?.fullName || t("dashboard.user.name")}
                      </span>
                      <span className="text-xs">
                        {displayUser?.email || "store@example.com"}
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
          
          <div className="flex-1 flex items-center justify-between ms-4">
            <Breadcrumb>
              <BreadcrumbList>
                {getBreadcrumbs().map((item, index) => (
                  <React.Fragment key={item.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.isCurrentPage ? (
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.title}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
      
      {/* Chat FAB Widget */}
      <ChatFabWidget />
    </div>
    </SidebarProvider>
  )
}

export default function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StoreDataProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </StoreDataProvider>
  )
}