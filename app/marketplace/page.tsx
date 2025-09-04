"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/localization-context"
import { MarketplaceContent } from "@/components/marketplace/marketplace-content"
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
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.renter_store")}
            </a>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.stores")}
            </Link>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.why_us_nav")}
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {t("nav.contact")}
            </a>
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
      <footer className="bg-muted mt-16">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="font-bold text-lg">{t("nav.about")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t("nav.home")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t("nav.contact")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t("nav.why_us")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-lg">{t("footer.help_center")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t("nav.dashboard")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {t("marketplace.footer.available_stations")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt={t("common.logo_alt")}
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold">{t("common.shibr")}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.description")}</p>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 {t("common.shibr")} - {t("footer.rights")}
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                {t("footer.terms")}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t("footer.privacy_policy")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}