"use client"

import type React from "react"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Home, FileText, Store, CreditCard, Settings, ChevronDown, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "الرئيسية", nameEn: "Dashboard", href: "/admin-dashboard", icon: Home },
  { name: "المنشورات", nameEn: "Posts", href: "/admin-dashboard/posts", icon: FileText },
  { name: "المحلات", nameEn: "Stores", href: "/admin-dashboard/stores", icon: Store },
  { name: "المدفوعات والتحصيلات", nameEn: "Payments", href: "/admin-dashboard/payments", icon: CreditCard },
  { name: "الإعدادات", nameEn: "Settings", href: "/admin-dashboard/settings", icon: Settings },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { language, t } = useLanguage()
  const pathname = usePathname()

  return (
    <div
      className={`min-h-screen bg-gray-50 ${language === "ar" ? "rtl" : "ltr"}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Shibr</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">الصفحة الرئيسية</span>
            <LanguageSwitcher />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>SH</AvatarFallback>
                  </Avatar>
                  <div className="text-end">
                    <div className="text-sm font-medium">Shadcn</div>
                    <div className="text-xs text-gray-500">m@example.com</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 me-2" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 me-2" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-3.5rem)] border-e bg-muted/30">
          <div className="p-4">
            <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-start">{language === "ar" ? item.name : item.nameEn}</span>
                </Link>
              )
            })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
