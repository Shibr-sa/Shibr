"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Package, ShoppingCart, Settings, ChevronDown, User, LogOut } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"

const sidebarItems = [
  {
    title: "brand.dashboard.home",
    href: "/brand-dashboard",
    icon: Home,
  },
  {
    title: "brand.dashboard.shelves",
    href: "/brand-dashboard/shelves",
    icon: Package,
  },
  {
    title: "brand.dashboard.products",
    href: "/brand-dashboard/products",
    icon: ShoppingCart,
  },
  {
    title: "brand.dashboard.settings",
    href: "/brand-dashboard/settings",
    icon: Settings,
  },
]

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t, direction } = useLanguage()

  return (
    <div className={`min-h-screen bg-muted/40 ${direction === "rtl" ? "font-cairo" : "font-inter"}`} dir={direction}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">ش</span>
            </div>
            <span className="text-lg font-bold text-foreground">{t("common.shibr")}</span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-8 px-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">{t("dashboard.profile")}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="h-4 w-4 me-2" />
                  <span>{t("dashboard.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 me-2" />
                  <span>{t("dashboard.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-3.5rem)] border-e bg-muted/30">
          <div className="p-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start gap-3 h-10 px-3">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-start">{t(item.title)}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
