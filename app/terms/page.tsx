"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Shield, Users, AlertCircle, Scale, Globe, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/localization-context"

export default function TermsPage() {
  const { t, language, direction } = useLanguage()
  const isArabic = language === "ar"
  const fontFamily = isArabic ? "font-cairo" : "font-inter"

  const sections = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: isArabic ? "تعريفات" : "Definitions",
      content: isArabic
        ? [
            "المنصة: موقع وتطبيق شبر الإلكتروني",
            "صاحب المحل: المستخدم الذي يملك محلاً تجارياً ويعرض أرففه للإيجار",
            "صاحب العلامة التجارية: المستخدم الذي يملك متجراً إلكترونياً ويرغب في استئجار أرفف",
            "الرف: المساحة المخصصة للعرض في المحل التجاري",
            "العمولة: النسبة التي تحصل عليها المنصة من كل عملية تأجير"
          ]
        : [
            "Platform: Shibr website and application",
            "Store Owner: User who owns a physical store and offers shelves for rent",
            "Brand Owner: User who owns an online store and wants to rent shelves",
            "Shelf: Display space allocated in the physical store",
            "Commission: Percentage the platform receives from each rental transaction"
          ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: isArabic ? "الاستخدام المقبول" : "Acceptable Use",
      content: isArabic
        ? [
            "يجب استخدام المنصة للأغراض التجارية المشروعة فقط",
            "يحظر عرض أو بيع المنتجات المحظورة أو غير القانونية",
            "يجب الالتزام بجميع القوانين واللوائح السعودية",
            "يحظر استخدام المنصة لأي أنشطة احتيالية أو مضللة",
            "يجب احترام حقوق الملكية الفكرية للآخرين"
          ]
        : [
            "Platform must be used for legitimate commercial purposes only",
            "Prohibited or illegal products cannot be displayed or sold",
            "All Saudi laws and regulations must be followed",
            "Platform cannot be used for fraudulent or misleading activities",
            "Intellectual property rights of others must be respected"
          ]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: isArabic ? "مسؤوليات أصحاب المحلات" : "Store Owner Responsibilities",
      content: isArabic
        ? [
            "توفير معلومات دقيقة وصحيحة عن الأرفف المعروضة",
            "الحفاظ على جودة ونظافة الأرفف المؤجرة",
            "السماح بالوصول للأرفف خلال ساعات العمل المتفق عليها",
            "حماية المنتجات المعروضة من السرقة أو التلف",
            "الالتزام بشروط العقد المبرم مع صاحب العلامة التجارية"
          ]
        : [
            "Provide accurate and correct information about displayed shelves",
            "Maintain quality and cleanliness of rented shelves",
            "Allow access to shelves during agreed working hours",
            "Protect displayed products from theft or damage",
            "Comply with contract terms with brand owner"
          ]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: isArabic ? "مسؤوليات أصحاب العلامات التجارية" : "Brand Owner Responsibilities",
      content: isArabic
        ? [
            "توفير منتجات ذات جودة عالية وآمنة للعرض",
            "دفع رسوم الإيجار في الوقت المحدد",
            "توفير معلومات دقيقة عن المنتجات المعروضة",
            "الالتزام بترتيب وتنظيم المنتجات على الأرفف",
            "احترام سياسات وقوانين المحل التجاري"
          ]
        : [
            "Provide high-quality and safe products for display",
            "Pay rental fees on time",
            "Provide accurate information about displayed products",
            "Maintain arrangement and organization of products on shelves",
            "Respect store policies and regulations"
          ]
    },
    {
      icon: <Scale className="h-5 w-5" />,
      title: isArabic ? "المدفوعات والعمولات" : "Payments and Commissions",
      content: isArabic
        ? [
            "تحصل المنصة على عمولة من قيمة كل عملية تأجير (راجع الأسعار الحالية في الإعدادات)",
            "يتم دفع المبالغ المستحقة خلال 7 أيام عمل",
            "جميع الأسعار المعروضة لا تشمل ضريبة القيمة المضافة",
            "يحق للمنصة تعديل نسبة العمولة بإشعار مسبق 30 يوماً",
            "في حالة الإلغاء، تطبق سياسة الإلغاء المعتمدة"
          ]
        : [
            "Platform receives commission from each rental transaction (see current rates in settings)",
            "Due amounts are paid within 7 business days",
            "All displayed prices exclude VAT",
            "Platform has the right to modify commission rate with 30 days notice",
            "In case of cancellation, approved cancellation policy applies"
          ]
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      title: isArabic ? "إخلاء المسؤولية" : "Disclaimer",
      content: isArabic
        ? [
            "المنصة وسيط بين أصحاب المحلات وأصحاب العلامات التجارية",
            "لا تتحمل المنصة مسؤولية جودة المنتجات المعروضة",
            "المنصة غير مسؤولة عن النزاعات بين الأطراف",
            "نبذل قصارى جهدنا لضمان دقة المعلومات لكن لا نضمن خلوها من الأخطاء",
            "المستخدم مسؤول عن قراراته التجارية بشكل كامل"
          ]
        : [
            "Platform is an intermediary between store owners and brand owners",
            "Platform is not responsible for quality of displayed products",
            "Platform is not responsible for disputes between parties",
            "We do our best to ensure information accuracy but don't guarantee it's error-free",
            "User is fully responsible for their business decisions"
          ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: isArabic ? "الخصوصية والبيانات" : "Privacy and Data",
      content: isArabic
        ? [
            "نحترم خصوصية المستخدمين ونحمي بياناتهم الشخصية",
            "لا نشارك البيانات مع أطراف ثالثة دون موافقة",
            "نستخدم البيانات لتحسين الخدمات المقدمة",
            "يحق للمستخدم طلب حذف بياناته في أي وقت",
            "نلتزم بقوانين حماية البيانات السعودية والدولية"
          ]
        : [
            "We respect user privacy and protect personal data",
            "We don't share data with third parties without consent",
            "We use data to improve provided services",
            "User has the right to request data deletion at any time",
            "We comply with Saudi and international data protection laws"
          ]
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: isArabic ? "القانون المطبق" : "Applicable Law",
      content: isArabic
        ? [
            "تخضع هذه الشروط لقوانين المملكة العربية السعودية",
            "أي نزاع يتم حله وفقاً للقوانين السعودية",
            "المحاكم السعودية هي الجهة المختصة بالنظر في النزاعات",
            "نسعى لحل النزاعات ودياً قبل اللجوء للقضاء"
          ]
        : [
            "These terms are subject to laws of Kingdom of Saudi Arabia",
            "Any dispute is resolved according to Saudi laws",
            "Saudi courts have jurisdiction over disputes",
            "We seek to resolve disputes amicably before litigation"
          ]
    }
  ]

  return (
    <div className={`min-h-screen bg-muted/30 ${fontFamily}`} dir={direction}>
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
              <span>{t("common.back")}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt={t("common.logo_alt")}
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">{t("common.shibr")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              {isArabic ? "الشروط والأحكام" : "Terms and Conditions"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isArabic
                ? "آخر تحديث: يناير 2024"
                : "Last updated: January 2024"}
            </p>
          </CardHeader>

          <CardContent>
            <div className="mb-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm leading-relaxed">
                {isArabic
                  ? "مرحباً بك في منصة شبر. باستخدامك لخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام المنصة."
                  : "Welcome to Shibr platform. By using our services, you agree to comply with these terms and conditions. Please read them carefully before using the platform."}
              </p>
            </div>

            <ScrollArea className="h-[600px] px-1">
              <div className="space-y-8">
                {sections.map((section, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-primary/10 text-primary ${direction === "rtl" ? "order-2" : ""}`}>
                        {section.icon}
                      </div>
                      <h2 className={`text-xl font-semibold ${direction === "rtl" ? "order-1" : ""}`}>
                        {direction === "rtl" ? `${section.title} .${index + 1}` : `${index + 1}. ${section.title}`}
                      </h2>
                    </div>
                    <ul className={`space-y-3 ${direction === "rtl" ? "pe-8 text-right" : "ps-8 text-left"}`}>
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className={`flex items-start gap-2 text-muted-foreground ${direction === "rtl" ? "flex-row-reverse" : ""}`}
                        >
                          <span className="text-primary mt-1.5 text-xs">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                    {index < sections.length - 1 && (
                      <Separator className="mt-8" />
                    )}
                  </div>
                ))}

                {/* Contact Section */}
                <div className="mt-8 pt-8 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-primary/10 text-primary ${direction === "rtl" ? "order-2" : ""}`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <h2 className={`text-xl font-semibold ${direction === "rtl" ? "order-1" : ""}`}>
                      {isArabic ? "اتصل بنا" : "Contact Us"}
                    </h2>
                  </div>
                  <p className={`text-muted-foreground mb-4 ${direction === "rtl" ? "text-right" : "text-left"}`}>
                    {isArabic
                      ? "إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا:"
                      : "If you have any questions about these Terms and Conditions, please contact us:"}
                  </p>
                  <div className={`space-y-2 text-muted-foreground ${direction === "rtl" ? "text-right" : "text-left"}`}>
                    <p className={direction === "rtl" ? "flex justify-end gap-2" : ""}>
                      {isArabic ? (
                        <>
                          <a href="mailto:support@shibr.sa" className="text-primary hover:underline">
                            support@shibr.sa
                          </a>
                          <span>:البريد الإلكتروني</span>
                        </>
                      ) : (
                        <>
                          <span>Email:</span>{" "}
                          <a href="mailto:support@shibr.sa" className="text-primary hover:underline">
                            support@shibr.sa
                          </a>
                        </>
                      )}
                    </p>
                    <p className={direction === "rtl" ? "flex justify-end gap-2" : ""}>
                      {isArabic ? (
                        <>
                          <a href="tel:+966500000000" className="text-primary hover:underline" dir="ltr">
                            +966 50 000 0000
                          </a>
                          <span>:الهاتف</span>
                        </>
                      ) : (
                        <>
                          <span>Phone:</span>{" "}
                          <a href="tel:+966500000000" className="text-primary hover:underline">
                            +966 50 000 0000
                          </a>
                        </>
                      )}
                    </p>
                    <p>
                      {isArabic
                        ? "العنوان: الرياض، المملكة العربية السعودية"
                        : "Address: Riyadh, Kingdom of Saudi Arabia"}
                    </p>
                  </div>
                </div>

                {/* Acceptance Section */}
                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className={`font-semibold mb-3 ${direction === "rtl" ? "text-right" : "text-left"}`}>
                    {isArabic ? "القبول والموافقة" : "Acceptance and Agreement"}
                  </h3>
                  <p className={`text-sm text-muted-foreground leading-relaxed ${direction === "rtl" ? "text-right" : "text-left"}`}>
                    {isArabic
                      ? "باستخدامك لمنصة شبر، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بجميع هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة."
                      : "By using Shibr platform, you acknowledge that you have read, understood, and agreed to be bound by all these terms and conditions. If you do not agree to any part of these terms, please do not use the platform."}
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/">
                  {isArabic ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {isArabic
              ? "© 2024 شبر. جميع الحقوق محفوظة."
              : "© 2024 Shibr. All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  )
}