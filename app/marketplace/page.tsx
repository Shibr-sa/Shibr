"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/localization-context"
import { MarketplaceContent } from "@/components/marketplace/marketplace-content"
import { SharedFooter } from "@/components/shared-footer"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"

export default function MarketplacePage() {
  const { t, direction } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Authentication state
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const user = useQuery(api.users.getCurrentUserWithProfile)

  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return "/"
    return user.accountType === "store_owner" ? "/store-dashboard" :
      user.accountType === "brand_owner" ? "/brand-dashboard" :
        user.accountType === "admin" ? "/admin-dashboard" : "/"
  }

  // Handle smooth scrolling for hash links
  useEffect(() => {
    const handleSmoothScroll = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const href = target.getAttribute('href')

      if (href && href.startsWith('#')) {
        e.preventDefault()
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }
    }

    // Add event listener to all hash links
    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach(link => {
      link.addEventListener('click', handleSmoothScroll as any)
    })

    // Cleanup
    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll as any)
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt={t("common.logo_alt")}
                width={24}
                height={24}
                className="h-14 w-14"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.home")}
            </Link>
            <Link href="/signup/select-type" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.renter_store")}
            </Link>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.stores")}
            </Link>
            <Link href="#why-choose" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.why_us_nav")}
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Authentication UI */}
            {authLoading || (isAuthenticated && user === undefined) ? (
              <Skeleton className="h-9 w-24" />
            ) : isAuthenticated && user ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={getDashboardPath()}>{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/signin">{t("nav.signin")}</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t("nav.close_menu") : t("nav.open_menu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background">
          <nav className="container py-4 space-y-2">
            <Link
              href="/"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/signup/select-type"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.renter_store")}
            </Link>
            <Link
              href="/marketplace"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.stores")}
            </Link>
            <Link
              href="#why-choose"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.why_us_nav")}
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="container py-8">
        <MarketplaceContent
          linkPrefix="/marketplace"
        />
      </div>

      {/* Footer */}
      <SharedFooter />
    </div>
  )
}