"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function SignUpSuccessPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center relative">
              <div className="w-8 h-8 border-2 border-primary-foreground rounded-md"></div>
              <div className="absolute -top-1 -end-1 w-6 h-6 border-2 border-primary-foreground rounded-md bg-primary"></div>
            </div>
            <span className="text-3xl font-bold text-foreground">Shibr</span>
          </div>
        </div>

        {/* Success Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center space-y-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-primary" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">شكراً لتسجيلك!</h1>

              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                تم استلام طلب انضمام متجرك بنجاح، وسيتم مراجعته من قبل فريق Shelfy خلال وقت قصير.
                <br />
                سنقوم بإشعارك فور اعتماد الحساب والبدء في استخدام المنصة.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Link href={redirectUrl || "/"}>
                <Button size="lg" className="w-full max-w-xs h-12 text-base font-medium">
                  {redirectUrl ? "العودة للمتجر" : "الصفحة الرئيسية"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            هل تحتاج مساعدة؟{" "}
            <Link href="/contact" className="text-primary hover:underline">
              تواصل معنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
