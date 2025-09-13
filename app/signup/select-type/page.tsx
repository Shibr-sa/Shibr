"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Store, Package, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { cn } from "@/lib/utils"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useEffect } from "react"

export default function SelectAccountTypePage() {
  const router = useRouter()
  const { t, direction } = useLanguage()
  const { isAuthenticated } = useConvexAuth()
  const userWithProfile = useQuery(api.users.getCurrentUserWithProfile)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userWithProfile) {
      const dashboardPath =
        userWithProfile.accountType === "store_owner" ? "/store-dashboard" :
        userWithProfile.accountType === "brand_owner" ? "/brand-dashboard" :
        userWithProfile.accountType === "admin" ? "/admin-dashboard" : "/dashboard"

      router.push(dashboardPath)
    }
  }, [isAuthenticated, userWithProfile, router])

  const handleSelection = (type: "store-owner" | "brand-owner") => {
    router.push(`/signup?type=${type}`)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Image
              src="/logo.svg"
              alt={t("common.logo_alt")}
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span className="text-3xl font-bold text-foreground">{t("common.shibr")}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">{t("auth.select_account_type")}</h1>
          <p className="text-muted-foreground text-lg">{t("auth.select_account_type_description")}</p>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Store Owner Card */}
          <Card
            className="relative cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={() => handleSelection("store-owner")}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Store className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t("auth.i_have_store")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("auth.store_owner_description")}
                </p>
                <ul className="text-sm text-start space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.store_benefit_1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.store_benefit_2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.store_benefit_3")}</span>
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                  {t("auth.continue_as_store_owner")}
                  <ArrowRight className={cn(
                    "h-4 w-4 ms-2",
                    direction === "rtl" && "rotate-180"
                  )} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Brand Owner Card */}
          <Card
            className="relative cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={() => handleSelection("brand-owner")}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Package className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t("auth.i_am_merchant")}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("auth.brand_owner_description")}
                </p>
                <ul className="text-sm text-start space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.brand_benefit_1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.brand_benefit_2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t("auth.brand_benefit_3")}</span>
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                  {t("auth.continue_as_brand_owner")}
                  <ArrowRight className={cn(
                    "h-4 w-4 ms-2",
                    direction === "rtl" && "rotate-180"
                  )} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Already have account link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t("auth.already_have_account")}{" "}
            <Link href="/signin" className="text-primary hover:underline font-medium">
              {t("auth.signin")}
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className={cn(
              "h-4 w-4",
              direction === "rtl" && "rotate-180"
            )} />
            {t("auth.back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  )
}