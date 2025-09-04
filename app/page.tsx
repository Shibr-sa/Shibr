"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Users, Store, TrendingUp, Award, Menu, Zap, Phone, Mail, MapPin, Building2, ShoppingBag, Target, UserPlus, DollarSign, PackageCheck, Settings, Search, CalendarCheck, BarChart3, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/contexts/localization-context"
import { useState } from "react"

// FAQ items will be created dynamically using translations

export default function ShibrLandingPage() {
  const { t, direction } = useLanguage()
  const [activeServiceType, setActiveServiceType] = useState<"stores" | "centers">("stores")
  
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

      {/* Hero Section */}
      <section className="container py-16 md:py-16">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl text-start">
                {t("hero.title")} <span className="text-primary">{t("hero.highlight")}</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-7 max-w-2xl text-start">
                {t("hero.description")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link href="/signup">
                <Button size="lg" className="text-base">
                  {t("hero.start_now")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative max-w-md mx-auto">
            <Image
              src="/hero_image.png"
              alt={`${t("hero.title")} ${t("hero.highlight")}`}
              width={600}
              height={400}
              className="w-full h-auto rounded-lg object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Shelfy Section */}
      <section className="bg-muted py-16">
        <div className="container text-center">
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-medium tracking-tight">
              {t("shelfy.title")} <span className="text-primary">{t("shelfy.highlight")}</span> {t("shelfy.subtitle")}
            </h2>
            <p className="text-xl text-muted-foreground leading-7">{t("shelfy.description")}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="text-base"
              variant={activeServiceType === "stores" ? "default" : "outline"}
              onClick={() => setActiveServiceType("stores")}
            >
              {t("shelfy.service_stores")}
            </Button>
            <Button 
              variant={activeServiceType === "centers" ? "default" : "outline"}
              size="lg" 
              className="text-base border-gray-300"
              onClick={() => setActiveServiceType("centers")}
            >
              {t("shelfy.commercial_centers")}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {activeServiceType === "stores" ? (
              <>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.smart_service")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.smart_service_desc")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.fast_service")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.fast_service_desc")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.integrated_service")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.integrated_service_desc")}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.centers.premium_locations")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.centers.premium_locations_desc")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <CalendarCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.centers.high_traffic")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.centers.high_traffic_desc")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-base font-medium">{t("shelfy.centers.targeted_audience")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("shelfy.centers.targeted_audience_desc")}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-medium tracking-tight text-start">
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

          <div className="grid grid-cols-2 gap-6">
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
      </section>

      {/* Why Choose Shelfy Section */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
            {/* Content Section */}
            <div className="space-y-8 text-start">
              <div className="space-y-6">
                <h2 className="text-3xl font-medium tracking-tight text-start">
                  <span className="text-primary">{t("why_choose.title")}</span> {t("why_choose.subtitle")}
                </h2>
                <p className="text-lg text-muted-foreground leading-7 text-start">
                  {t("why_choose.description")}
                </p>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-center">{t("features.clear_rights.title")}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("features.clear_rights.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-center">{t("features.empty_spaces.title")}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("features.empty_spaces.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-center">{t("features.real_reach.title")}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("features.real_reach.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-center">{t("features.flexible_rental.title")}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("features.flexible_rental.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="space-y-6">
              <h2 className="text-3xl font-medium tracking-tight">
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
                className="border rounded-lg"
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
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="container py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt={t("common.logo_alt")}
                  width={40}
                  height={40}
                  className="h-10 w-10 brightness-0 invert"
                />
                <span className="text-lg font-medium">{t("common.shibr")}</span>
              </div>
              <p className="text-sm text-primary-foreground/80 text-start">{t("footer.description")}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-medium text-start">{t("footer.company")}</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/80">
                <li>
                  <Link href="/signin" className="hover:text-primary-foreground text-start block">
                    {t("footer.dashboard")}
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-primary-foreground text-start block">
                    {t("footer.available_stores")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-medium text-start">{t("footer.customer_service")}</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/80">
                <li>
                  <Link href="/" className="hover:text-primary-foreground text-start block">
                    {t("footer.home")}
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground text-start block">
                    {t("footer.contact_us")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground text-start block">
                    {t("footer.why_us")}
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <Separator className="bg-primary-foreground/20 mb-8" />

          <div className="text-center">
            <p className="text-sm text-primary-foreground/60">
              © 2025 {t("common.shibr")}. {t("footer.rights")}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
