"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Users, Store, TrendingUp, Award, Menu, Zap, Phone, Mail, MapPin, Building2, ShoppingBag, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
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
    <div className={`min-h-screen bg-background ${direction === "rtl" ? "font-cairo" : "font-inter"}`} dir={direction}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Shibr Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-foreground">{t("common.shibr")}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.home")}
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.products")}
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.about")}
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.services")}
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.contact")}
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.blog")}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/signin">
              <Button size="sm">{t("nav.signin")}</Button>
            </Link>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-24">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight md:text-3xl text-start">
                {t("hero.title")} <span className="text-primary">{t("hero.highlight")}</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl text-start">
                {t("hero.description")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link href="/marketplace">
                <Button size="lg" className="text-base">
                  {t("hero.start_now")}
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-base bg-transparent">
                {t("hero.learn_more")}
              </Button>
            </div>
          </div>

          <div className="relative max-w-md mx-auto">
            <Image
              src="/placeholder.svg?height=280&width=400"
              alt={`${t("hero.title")} ${t("hero.highlight")}`}
              width={400}
              height={280}
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Shelfy Section */}
      <section className="bg-muted py-24">
        <div className="container text-center">
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold lg:text-3xl">
              {t("shelfy.title")} <span className="text-primary">{t("shelfy.highlight")}</span> {t("shelfy.subtitle")}
            </h2>
            <p className="font-semibold text-muted-foreground text-xl">{t("shelfy.description")}</p>
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

          <div className="grid md:grid-cols-3 gap-8 mb-0">
            {activeServiceType === "stores" ? (
              <>
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.smart_service")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.smart_service_desc")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.fast_service")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.fast_service_desc")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.integrated_service")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.integrated_service_desc")}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.centers.premium_locations")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.centers.premium_locations_desc")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.centers.high_traffic")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.centers.high_traffic_desc")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">{t("shelfy.centers.targeted_audience")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{t("shelfy.centers.targeted_audience_desc")}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold lg:text-3xl text-start">
                {t("video.title")} <span className="text-primary">{t("video.highlight")}</span>
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed mb-0 text-start">{t("video.description")}</p>
            </div>

            <div className="flex justify-start">
              <Link href="/store-dashboard">
                <Button size="lg" className="text-base mt-6">
                  {t("video.start_journey")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src="/placeholder.svg?height=400&width=300"
                  alt="جدة - مواقع المتاجر المتاحة"
                  width={300}
                  height={400}
                  className="w-full aspect-[3/4] object-cover"
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src="/placeholder.svg?height=400&width=300"
                  alt="الرياض - مواقع المتاجر المتاحة"
                  width={300}
                  height={400}
                  className="w-full aspect-[3/4] object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Shelfy Section */}
      <section className="bg-muted py-24">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
            {/* Content Section */}
            <div className="space-y-8 text-start">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-secondary leading-tight text-start">
                  ليش تختار شبر؟ المنصة اللي تجمع بين التجارة الواقعية والرقمية في مكان واحد
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed text-start">
                  سواء كنت صاحب محل، تبغى تزيد دخلك، أو متجر إلكتروني تبغى توصل لعملائك في الواقع، Shelfy مصممة تقدم لك
                  تجربة سلسة، مرنة، وتحفظ حقوقك من أول رف إلى آخر بيع.
                </p>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary text-center">{t("features.clear_rights.title")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed text-center">
                      {t("features.clear_rights.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary text-center">{t("features.empty_spaces.title")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed text-center">
                      {t("features.empty_spaces.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                      <Store className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary text-center">{t("features.real_reach.title")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed text-center">
                      {t("features.real_reach.description")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary text-center">{t("features.flexible_rental.title")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed text-center">
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
      <section className="container py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold lg:text-3xl">
                {t("faq.title")} <span className="text-primary">{t("faq.highlight")}</span>
              </h2>

              <p className="text-muted-foreground text-xl">{t("faq.description")}</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline text-start">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0 text-muted-foreground text-base leading-relaxed text-start">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="container py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Shibr Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 opacity-80"
                />
                <span className="text-xl font-bold">{t("common.shibr")}</span>
              </div>
              <p className="text-primary-foreground/80 leading-relaxed text-start">{t("footer.description")}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-lg text-start">{t("footer.company")}</h4>
              <ul className="space-y-3 text-primary-foreground/80">
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.about_us")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.team")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.jobs")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("nav.blog")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-lg text-start">{t("footer.customer_service")}</h4>
              <ul className="space-y-3 text-primary-foreground/80">
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.help_center")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.contact_us")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.privacy_policy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors text-start block">
                    {t("footer.terms")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-lg text-start">{t("footer.contact_us")}</h4>
              <div className="space-y-3 text-primary-foreground/80">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span className="text-start">{t("footer.phone")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="text-start">{t("footer.email")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-start">{t("footer.address")}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4 justify-start">
                <Button size="sm" variant="secondary">
                  تويتر
                </Button>
                <Button size="sm" variant="secondary">
                  لينكد إن
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-primary-foreground/20 mb-8" />

          <div className="text-center">
            <p className="text-primary-foreground/60">
              © 2024 {t("common.shibr")}. {t("footer.rights")}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
