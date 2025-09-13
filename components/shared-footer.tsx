"use client"

import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/localization-context"

interface SharedFooterProps {
  id?: string
}

export function SharedFooter({ id = "contact" }: SharedFooterProps) {
  const { t } = useLanguage()

  return (
    <footer id={id} className="bg-primary text-primary-foreground">
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
                <Link href="/contact" className="hover:text-primary-foreground text-start block">
                  {t("footer.contact_us")}
                </Link>
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

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2025 {t("common.shibr")}. {t("footer.rights")}.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
            <Link href="/terms" className="hover:text-primary-foreground">
              {t("auth.terms_and_conditions")}
            </Link>
            <Link href="/contact" className="hover:text-primary-foreground">
              {t("footer.contact_us")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}