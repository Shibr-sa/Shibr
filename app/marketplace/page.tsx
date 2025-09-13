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

export default function MarketplacePage() {
  const { t, direction } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt={t("common.logo_alt")}
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-medium">{t("common.shibr")}</span>
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
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.why_us_nav")}
            </a>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button size="sm" asChild>
              <Link href="/signin">{t("nav.signin")}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <MarketplaceContent 
          linkPrefix="/signin?redirect=/marketplace"
        />
      </div>

      {/* Footer */}
      <SharedFooter />
    </div>
  )
}