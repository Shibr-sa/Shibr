import type React from "react"
import type { Metadata } from "next"
import { Cairo, Inter } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import { LanguageProvider } from "@/contexts/localization-context"
import { ConvexClientProvider } from "@/components/convex-provider"
import { Toaster } from "@/components/ui/toaster"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "optional", // Changed from swap to optional to prevent flicker
  preload: true,
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "optional", // Changed from swap to optional to prevent flicker
  preload: true,
})

export const metadata: Metadata = {
  title: "Shibr - منصة ذكية تربط بين المتاجر",
  description: "منصة ذكية تربط بين المتاجر الواقعية والمتاجر الإلكترونية",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const languageCookie = cookieStore.get('language')?.value
  const language = (languageCookie === 'en' || languageCookie === 'ar') ? languageCookie : 'ar'
  const direction = language === 'ar' ? 'rtl' : 'ltr'
  
  return (
    <html lang={language} dir={direction}>
      <body className={`${cairo.variable} ${inter.variable} ${language === 'ar' ? 'font-cairo' : 'font-inter'} antialiased`}>
        <ConvexClientProvider>
          <LanguageProvider initialLanguage={language as 'ar' | 'en'}>
            {children}
            <Toaster />
          </LanguageProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
