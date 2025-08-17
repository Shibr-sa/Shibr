"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, FileText, Store, CreditCard, Settings, ChevronUp, LogOut, Users, Package, TrendingUp } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
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
  { title: "dashboard.home", href: "/admin-dashboard", icon: Home, pageTitle: "dashboard.control_panel" },
  { title: "dashboard.posts", href: "/admin-dashboard/posts", icon: FileText, pageTitle: "dashboard.posts" },
  { title: "dashboard.stores", href: "/admin-dashboard/stores", icon: Store, pageTitle: "dashboard.stores" },
  { title: "dashboard.shelves", href: "/admin-dashboard/brands", icon: Package, pageTitle: "dashboard.shelves" },
  { title: "dashboard.payments", href: "/admin-dashboard/payments", icon: CreditCard, pageTitle: "dashboard.payments" },
  { title: "dashboard.settings", href: "/admin-dashboard/settings", icon: Settings, pageTitle: "dashboard.settings" },
]

export default function AdminDashboardLayout({
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
      title: t("dashboard.admin"),
      href: "/admin-dashboard",
      isCurrentPage: pathname === "/admin-dashboard"
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
                      <span className="text-xs">{t("dashboard.admin")}</span>
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
                          {user ? getInitials() : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5 text-start leading-none">
                        <span className="text-sm font-medium">
                          {user?.fullName || t("dashboard.user.name")}
                        </span>
                        <span className="text-xs">
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
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6">
            <SidebarTrigger className="-ms-2" />
            
            <div className="flex-1 flex items-center justify-between ms-4">
              <div className="flex items-center gap-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    {getBreadcrumbs().map((item, index) => (
                      <React.Fragment key={item.href}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {item.isCurrentPage ? (
                            <BreadcrumbPage className="font-medium">{item.title}</BreadcrumbPage>
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
              </div>
              
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-muted/40">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}