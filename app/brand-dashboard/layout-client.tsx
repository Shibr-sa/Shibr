"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Home, Package, ShoppingCart, Settings, ChevronUp, LogOut, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useSignOut } from "@/hooks/use-sign-out"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { BrandDataProvider, useBrandData } from "@/contexts/brand-data-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Id } from "@/convex/_generated/dataModel"
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
  SidebarInset,
} from "@/components/ui/sidebar"

const sidebarItems = [
  { title: "dashboard.home", href: "/brand-dashboard", icon: Home, pageTitle: "dashboard.home" },
  { title: "dashboard.shelves", href: "/brand-dashboard/shelves", icon: ShoppingCart, pageTitle: "dashboard.shelves" },
  { title: "dashboard.products", href: "/brand-dashboard/products", icon: Package, pageTitle: "dashboard.products" },
  { title: "dashboard.settings", href: "/brand-dashboard/settings", icon: Settings, pageTitle: "dashboard.settings" },
]

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, direction } = useLanguage()
  const { user, getInitials: getSessionInitials } = useCurrentUser()
  const { userData } = useBrandData()
  
  // Use userData from context if available, fallback to user from session
  const displayUser = userData || user
  
  // Get unread message counts
  const unreadCounts = useQuery(
    api.chats.getUnreadMessageCounts,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  const getInitials = () => {
    if (userData) {
      const profile = userData.profile
      const name = profile?.fullName || userData.name || profile?.brandName || "Brand"
      const parts = name.split(" ")
      if (parts.length > 1) {
        return parts[0][0] + parts[1][0]
      }
      return name.substring(0, 2).toUpperCase()
    }
    return getSessionInitials()
  }
  

  const handleLogout = useSignOut()

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
      title: t("dashboard.brand"),
      href: "/brand-dashboard",
      isCurrentPage: pathname === "/brand-dashboard"
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
          // Handle sub-pages (e.g., /brand-dashboard/shelves/add)
          switch(segment) {
            case 'add':
              title = t("common.add")
              break
            case 'edit':
              title = t("common.edit")
              break
            case 'details':
              title = t("common.details")
              break
            case 'marketplace':
              title = t("marketplace.title")
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
    <BrandDataProvider>
      <SidebarProvider>
        <>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link href="/brand-dashboard">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Image
                          src="/logo.svg"
                          alt={t("common.logo_alt")}
                          width={20}
                          height={20}
                          className="size-5 brightness-0 invert"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold">{t("common.shibr")}</span>
                        <span className="text-xs">{t("dashboard.brand")}</span>
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
                          <Link href={item.href} className="relative">
                            <item.icon className="size-4" />
                            <span className="flex-1">{t(item.title)}</span>
                            {item.href === "/brand-dashboard/shelves" && unreadCounts && unreadCounts.total > 0 && (
                              <Badge variant="destructive" className="ms-auto h-5 px-1.5 text-xs">
                                {unreadCounts.total > 99 ? "99+" : unreadCounts.total}
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
                          <AvatarImage src={displayUser?.image || displayUser?.profileImageUrl || displayUser?.avatar} alt={displayUser?.fullName} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {displayUser ? getInitials() : "BR"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5 text-start leading-none">
                          <span className="text-sm font-medium">
                            {displayUser?.profile?.brandName || displayUser?.profile?.fullName || displayUser?.name || t("dashboard.user.name")}
                          </span>
                          <span className="text-xs">
                            {displayUser?.email || "brand@example.com"}
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
                      <DropdownMenuItem asChild>
                        <Link href="/">
                          <ExternalLink className="me-2 h-4 w-4" />
                          <span>{t("dashboard.view_landing_page")}</span>
                        </Link>
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
          
          <SidebarInset>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ms-1" />
              <Separator orientation="vertical" className="me-2 h-4" />
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
              <div className="ms-auto flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </>
      </SidebarProvider>
    </BrandDataProvider>
  )
}