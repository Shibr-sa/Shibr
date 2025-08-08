import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, ChevronLeft, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function RequestSuccessPage() {
  return (
    <div className="min-h-screen bg-muted/40 font-cairo" dir="rtl">
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
            <span className="text-xl font-bold text-foreground">Shibr</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              الرئيسية
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              المستأجر والمتجر
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              المحلات
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              لماذا نحن
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              تواصل معنا
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">لوحة التحكم</span>
              <ChevronLeft className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-24">
        <div className="bg-background rounded-lg shadow-sm max-w-4xl mx-auto p-12 text-center">
          <div className="flex justify-center mb-8">
            <CheckCircle className="h-32 w-32 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">تم إرسال طلبك بنجاح</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10">
            سيتم إشعارك فور مراجعة صاحب المحل للطلب.
          </p>
          <div className="flex justify-center items-center gap-4">
            <Link href="/brand-dashboard">
              <Button size="lg" className="text-base">
                الذهاب الى لوحة التحكم
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background mt-16 border-t">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.svg"
                  alt="Shibr Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold">Shibr</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                شبر هي منصة تقنية تربط بين المتاجر الإلكترونية والمحلات التجارية الواقعية من خلال عرض وتأجير مساحات رفوف
                مخصصة داخل المحلات، بهدف تحويل المساحات غير المستغلة إلى نقاط بيع فورية.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg">روابط هامه</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    لوحة التحكم
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    المحلات المتاحة
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-lg">اكتشف</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    الرئيسية
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    تواصل معنا
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    لماذا نحن
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">جميع الحقوق محفوظة - لشلفي 2025</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                سياسة الخصوصية
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                الشروط
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
