"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Package, ShoppingCart, Settings, ChevronDown, User, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"

const sidebarItems = [
  {
    title: "dashboard.home",
    href: "/store-dashboard",
    icon: Home,
  },
  {
    title: "dashboard.shelves",
    href: "/store-dashboard/shelves",
    icon: Package,
  },
  {
    title: "dashboard.orders",
    href: "/store-dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "dashboard.settings",
    href: "/store-dashboard/settings",
    icon: Settings,
  },
]

export default function StoreDashboardLayout({
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
            <Image
              src="/logo.svg"
              alt="Shibr Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
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
        <aside className="w-64 min-h-[calc(100vh-3.5rem)] border-e bg-background">
          <div className="flex flex-col py-4 px-3">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="me-2 h-4 w-4" />
                      {t(item.title)}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
