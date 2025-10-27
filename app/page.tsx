"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Users, Store, TrendingUp, Award, Menu, Zap, Phone, Mail, MapPin, Building2, ShoppingBag, Target, UserPlus, DollarSign, PackageCheck, Settings, Search, CalendarCheck, BarChart3, Twitter, Linkedin, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/localization-context"
import { useState, useEffect } from "react"
import { SharedFooter } from "@/components/shared-footer"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"

// FAQ items will be created dynamically using translations

export default function ShibrLandingPage() {
  const { t, direction } = useLanguage()
  const [activeServiceType, setActiveServiceType] = useState<"stores" | "centers">("stores")
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

  // Create FAQ items dynamically from translations
  const faqItems = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt={t("common.logo_alt")}
              width={24}
              height={24}
              className="h-14 w-14"
            />
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

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-28 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-start">
                  {t("hero.title")} <span className="text-primary">{t("hero.highlight")}</span>
                </h1>

                <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl text-start">
                  {t("hero.description")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                {authLoading || (isAuthenticated && user === undefined) ? (
                  <Button size="lg" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </Button>
                ) : isAuthenticated && user ? (
                  <Link href={getDashboardPath()}>
                    <Button size="lg">
                      {t("hero.go_to_dashboard")}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup/select-type">
                    <Button size="lg">
                      {t("hero.start_now")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="relative w-full h-full">
              <div className="relative aspect-[4/3] lg:aspect-square w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/hero_image.png"
                  alt={`${t("hero.title")} ${t("hero.highlight")}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover object-center transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="bg-muted py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl text-start">
                  {t("video.title")} <span className="text-primary">{t("video.highlight")}</span>
                </h2>

                <p className="text-lg text-muted-foreground leading-7 mb-0 text-start">{t("video.description")}</p>
              </div>

              <div className="flex justify-start">
                <Link href="/marketplace">
                  <Button size="lg" className="text-base mt-6">
                    {t("video.start_journey")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="overflow-hidden group">
                <CardContent className="p-0 relative">
                  <div className="aspect-[3/4] relative w-full overflow-hidden bg-muted">
                    <Image
                      src="/jaddah_image.png"
                      alt={t("video.jeddah_stores")}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden group">
                <CardContent className="p-0 relative">
                  <div className="aspect-[3/4] relative w-full overflow-hidden bg-muted">
                    <Image
                      src="/riyadh_image.jpg"
                      alt={t("video.riyadh_stores")}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stores Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("stores.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-7">
              {t("stores.description")}
            </p>
          </div>
        </div>
      </section>

      {/* شبر Section */}
      <section className="bg-muted py-16 md:py-20 lg:py-24">
        <div className="container text-center">
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("shibr.title")} <span className="text-primary">{t("shibr.highlight")}</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-7">{t("shibr.description")}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant={activeServiceType === "stores" ? "default" : "outline"}
              onClick={() => setActiveServiceType("stores")}
            >
              {t("shibr.service_stores")}
            </Button>
            <Button
              size="lg"
              variant={activeServiceType === "centers" ? "default" : "outline"}
              onClick={() => setActiveServiceType("centers")}
            >
              {t("shibr.commercial_centers")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {activeServiceType === "stores" ? (
              <>
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.smart_service")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.smart_service_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.fast_service")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.fast_service_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <DollarSign className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.integrated_service")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.integrated_service_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Search className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.centers.premium_locations")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.centers.premium_locations_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CalendarCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.centers.high_traffic")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.centers.high_traffic_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{t("shibr.centers.targeted_audience")}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>
                      {t("shibr.centers.targeted_audience_desc")}
                    </CardDescription>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose شبر Section */}
      <section id="why-choose" className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
            {/* Content Section */}
            <div className="space-y-8 text-start">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl text-start">
                  {t("why_choose.subtitle")} <span className="text-primary">{t("why_choose.title")}</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-7 text-start">
                  {t("why_choose.description")}
                </p>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-lg">{t("features.clear_rights.title")}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    {t("features.clear_rights.description")}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-lg">{t("features.empty_spaces.title")}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    {t("features.empty_spaces.description")}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-lg">{t("features.real_reach.title")}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    {t("features.real_reach.description")}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Award className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-lg">{t("features.flexible_rental.title")}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    {t("features.flexible_rental.description")}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {t("faq.title")} <span className="text-primary">{t("faq.highlight")}</span>
                </h2>

                <p className="text-xl text-muted-foreground leading-7">{t("faq.description")}</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg bg-background"
                >
                  <AccordionTrigger className="px-6 py-4 text-base font-medium hover:no-underline text-start">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-sm text-muted-foreground text-start">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <SharedFooter />
    </div>
  )
}
