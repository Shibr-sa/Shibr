"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const { t, language, direction } = useLanguage()
  const { toast } = useToast()
  const isArabic = language === "ar"
  const fontFamily = isArabic ? "font-cairo" : "font-inter"

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subjects = [
    {
      value: "general",
      label: isArabic ? "استفسار عام" : "General Inquiry",
      icon: <HelpCircle className="h-4 w-4" />
    },
    {
      value: "support",
      label: isArabic ? "دعم فني" : "Technical Support",
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      value: "business",
      label: isArabic ? "شراكة أعمال" : "Business Partnership",
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      value: "complaint",
      label: isArabic ? "شكوى" : "Complaint",
      icon: <AlertCircle className="h-4 w-4" />
    }
  ]

  const contactInfo = [
    {
      icon: <Phone className="h-5 w-5" />,
      title: isArabic ? "الهاتف" : "Phone",
      value: "+966 53 641 2311",
      link: "tel:+966536412311",
      dir: "ltr"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: isArabic ? "البريد الإلكتروني" : "Email",
      value: "info@shibr.io",
      link: "mailto:info@shibr.io"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: isArabic ? "العنوان" : "Address",
      value: isArabic
        ? "الرياض، المملكة العربية السعودية"
        : "Riyadh, Kingdom of Saudi Arabia"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: isArabic ? "ساعات العمل" : "Working Hours",
      value: isArabic
        ? "الأحد - الخميس: 9:00 ص - 6:00 م"
        : "Sunday - Thursday: 9:00 AM - 6:00 PM"
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = isArabic ? "الاسم مطلوب" : "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = isArabic ? "البريد الإلكتروني مطلوب" : "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = isArabic ? "البريد الإلكتروني غير صالح" : "Invalid email address"
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isArabic ? "رقم الهاتف مطلوب" : "Phone number is required"
    } else {
      const phoneRegex = /^[0-9+\-\s()]+$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = isArabic ? "رقم الهاتف غير صالح" : "Invalid phone number"
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = isArabic ? "الرسالة مطلوبة" : "Message is required"
    } else if (formData.message.length < 10) {
      newErrors.message = isArabic
        ? "الرسالة يجب أن تكون 10 أحرف على الأقل"
        : "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setIsSubmitted(true)
      toast({
        title: isArabic ? "تم الإرسال بنجاح" : "Sent Successfully",
        description: isArabic
          ? "سنتواصل معك في أقرب وقت ممكن"
          : "We'll get back to you as soon as possible",
      })
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى"
          : "An error occurred while sending. Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
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

        {/* Success Content */}
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardContent className="pt-8">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold">
                  {isArabic ? "تم إرسال رسالتك بنجاح" : "Message Sent Successfully"}
                </h1>
                <p className="text-muted-foreground">
                  {isArabic
                    ? "شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن."
                    : "Thank you for contacting us. We'll respond to you as soon as possible."}
                </p>
                <div className="pt-4 space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/">
                      {isArabic ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false)
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        subject: "general",
                        message: ""
                      })
                    }}
                  >
                    {isArabic ? "إرسال رسالة أخرى" : "Send Another Message"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {isArabic ? "تواصل معنا" : "Contact Us"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isArabic
              ? "نحن هنا لمساعدتك. تواصل معنا لأي استفسارات أو دعم أو اقتراحات"
              : "We're here to help. Contact us for any inquiries, support, or suggestions"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className={direction === "rtl" ? "text-right" : "text-left"}>
                  {isArabic ? "معلومات التواصل" : "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 text-primary ${direction === "rtl" ? "order-2" : ""}`}>
                      {info.icon}
                    </div>
                    <div className={`flex-1 ${direction === "rtl" ? "order-1 text-right" : "text-left"}`}>
                      <p className="font-medium mb-1">{info.title}</p>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          dir={info.dir}
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Social Media */}
                <div className="pt-6 border-t">
                  <p className={`font-medium mb-4 ${direction === "rtl" ? "text-right" : "text-left"}`}>
                    {isArabic ? "تابعنا على" : "Follow Us"}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://x.com/shibr_io"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (Twitter)"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://www.tiktok.com/@shibr_io"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                        </svg>
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://www.instagram.com/shibr_io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                        </svg>
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://www.linkedin.com/company/shibr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://wa.me/966536412311"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className={direction === "rtl" ? "text-right" : "text-left"}>
                  {isArabic ? "أرسل لنا رسالة" : "Send Us a Message"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className={direction === "rtl" ? "text-right block" : "text-left block"}>
                      {isArabic ? "الاسم الكامل" : "Full Name"}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder={isArabic ? "أدخل اسمك الكامل" : "Enter your full name"}
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={direction === "rtl" ? "text-right" : "text-left"}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className={`text-xs text-destructive ${direction === "rtl" ? "text-right" : "text-left"}`}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className={direction === "rtl" ? "text-right block" : "text-left block"}>
                        {isArabic ? "البريد الإلكتروني" : "Email"}
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={isArabic ? "example@email.com" : "example@email.com"}
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={direction === "rtl" ? "text-right" : "text-left"}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className={`text-xs text-destructive ${direction === "rtl" ? "text-right" : "text-left"}`}>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className={direction === "rtl" ? "text-right block" : "text-left block"}>
                        {isArabic ? "رقم الهاتف" : "Phone Number"}
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={isArabic ? "05xxxxxxxx" : "05xxxxxxxx"}
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={direction === "rtl" ? "text-right" : "text-left"}
                        dir="ltr"
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && (
                        <p className={`text-xs text-destructive ${direction === "rtl" ? "text-right" : "text-left"}`}>
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className={direction === "rtl" ? "text-right block" : "text-left block"}>
                      {isArabic ? "نوع الرسالة" : "Message Type"}
                    </Label>
                    <RadioGroup
                      value={formData.subject}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {subjects.map((subject) => (
                        <div key={subject.value}>
                          <RadioGroupItem
                            value={subject.value}
                            id={subject.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={subject.value}
                            className={`flex items-center gap-2 rounded-lg border-2 border-muted bg-background p-4 hover:bg-muted/50 cursor-pointer peer-data-[state=checked]:border-primary ${
                              direction === "rtl" ? "flex-row-reverse" : ""
                            }`}
                          >
                            {subject.icon}
                            {subject.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className={direction === "rtl" ? "text-right block" : "text-left block"}>
                      {isArabic ? "الرسالة" : "Message"}
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={isArabic
                        ? "اكتب رسالتك هنا..."
                        : "Write your message here..."}
                      value={formData.message}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`min-h-[120px] sm:min-h-[150px] ${direction === "rtl" ? "text-right" : "text-left"}`}
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && (
                      <p className={`text-xs text-destructive ${direction === "rtl" ? "text-right" : "text-left"}`}>
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {isArabic ? "جاري الإرسال..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <Send className={`h-4 w-4 ${direction === "rtl" ? "ms-2" : "me-2"}`} />
                        {isArabic ? "إرسال الرسالة" : "Send Message"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}