"use client"

import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/localization-context"
import { Instagram, Linkedin } from "lucide-react"

interface SharedFooterProps
{
  id?: string
}

export function SharedFooter({ id = "contact" }: SharedFooterProps)
{
  const { t } = useLanguage()

  return (
    <footer id={ id } className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt={ t("common.logo_alt") }
                width={ 40 }
                height={ 40 }
                className="h-10 w-10 brightness-0 invert"
              />
              <span className="text-lg font-medium">{ t("common.shibr") }</span>
            </div>
            <p className="text-sm text-primary-foreground/80 text-start">{ t("footer.description") }</p>

            {/* Social Media Links */ }
            <div className="flex items-center gap-3">
              <Link href="https://x.com/shibr_io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link href="https://www.tiktok.com/@shibr_io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="TikTok"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </Link>
              <Link href="https://www.instagram.com/shibr_io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="https://www.linkedin.com/company/shibr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link href="https://wa.me/966536412311"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="WhatsApp"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-medium text-start">{ t("footer.company") }</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link href="/signin" className="hover:text-primary-foreground text-start block">
                  { t("footer.dashboard") }
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-primary-foreground text-start block">
                  { t("footer.available_stores") }
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-medium text-start">{ t("footer.customer_service") }</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link href="/" className="hover:text-primary-foreground text-start block">
                  { t("footer.home") }
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-foreground text-start block">
                  { t("footer.contact_us") }
                </Link>
              </li>
              <li>
                <Link href="#why-choose" className="hover:text-primary-foreground text-start block">
                  { t("footer.why_us") }
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-primary-foreground/20 mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2025 { t("common.shibr") }. { t("footer.rights") }.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
            <Link href="/terms" className="hover:text-primary-foreground">
              { t("auth.terms_and_conditions") }
            </Link>
            <Link href="/contact" className="hover:text-primary-foreground">
              { t("footer.contact_us") }
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}