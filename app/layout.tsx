import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cairo, Inter } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import { LanguageProvider } from "@/contexts/localization-context"
import { ConvexClientProvider } from "@/components/convex-provider"
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"
import { ThemeProvider } from "@/components/theme-provider"
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
  title: "شبر",
  description: "منصة ذكية تربط بين المتاجر الواقعية والمتاجر الإلكترونية",
  metadataBase: new URL('https://shibr.io'),
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'شبر - منصة ذكية تربط بين المتاجر',
    description: 'منصة ذكية تربط بين المتاجر الواقعية والمتاجر الإلكترونية',
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'شعار شبر',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'شبر',
    description: 'منصة ذكية تربط بين المتاجر الواقعية والمتاجر الإلكترونية',
    images: ['/logo.svg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#725CAD',
  width: 'device-width',
  initialScale: 1,
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
    <html lang={language} dir={direction} suppressHydrationWarning>
      <body className={`${cairo.variable} ${inter.variable} ${language === 'ar' ? 'font-cairo' : 'font-inter'} antialiased`}>
        <ConvexAuthNextjsServerProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <LanguageProvider initialLanguage={language as 'ar' | 'en'}>
                {children}
                <Toaster />
              </LanguageProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
