import type React from "react"
import type { Metadata } from "next"
import { Cairo, Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/contexts/localization-context"
import { ConvexClientProvider } from "@/components/convex-provider"
import { Toaster } from "@/components/ui/toaster"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Shibr - منصة ذكية تربط بين المتاجر",
  description: "منصة ذكية تربط بين المتاجر الواقعية والمتاجر الإلكترونية",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${inter.variable} antialiased`}>
        <ConvexClientProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
