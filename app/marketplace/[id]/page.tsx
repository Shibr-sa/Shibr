"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, Paperclip, Camera, Send, ChevronLeft, User } from "lucide-react"
import Image from "next/image"

// Mock data for a single store, you would fetch this based on the `id` param
const storeDetails = {
  id: 1,
  name: "كوفي سيوت",
  price: "2000 / شهري",
  location: "حطين، الرياض 13512، المملكة العربية السعودية",
  image: "/placeholder.svg?height=300&width=500",
  details: [
    { icon: CalendarDays, label: "متاح من", value: "1 أبريل" },
    { icon: Ruler, label: "الأبعاد", value: "20*50m" },
    { icon: Box, label: "نوع الرف", value: "جدار" },
  ],
  owner: {
    name: "mohamed ashraf",
    avatar: "/placeholder.svg?height=40&width=40",
  },
}

export default function MarketDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally handle form validation and API call
    // For now, we'll just navigate to the success page
    router.push(`/marketplace/${params.id}/success`)
  }

  return (
    <div className="min-h-screen bg-muted/40 font-cairo" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">ش</span>
            </div>
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
              <User className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">لوحة التحكم</span>
              <ChevronLeft className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="flex flex-col gap-8">
          {/* Top Section: Store Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-6">
                <Image
                  src={storeDetails.image || "/placeholder.svg"}
                  alt={storeDetails.name}
                  width={500}
                  height={300}
                  className="w-full md:w-1/3 h-64 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{storeDetails.name}</h1>
                  <p className="text-primary text-xl font-semibold mb-4">{storeDetails.price}</p>
                  <div className="flex items-start gap-2 text-muted-foreground mb-6">
                    <MapPin className="h-5 w-5 mt-1 flex-shrink-0" />
                    <span>{storeDetails.location}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    {storeDetails.details.map((detail, index) => (
                      <div key={index} className="text-center">
                        <detail.icon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{detail.label}</p>
                        <p className="text-sm font-semibold">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Section: Form and Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rental Form */}
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl">أرسل طلبك لاستئجار هذا الرف</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    ادخل بياناتك وحدد مدة الحجز. وسوف يتم إرسال الطلب لصاحب المحل للمراجعة والموافقة خلال وقت قصير.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="booking-date">مدة الحجز المطلوبة*</Label>
                    <div className="relative">
                      <Input id="booking-date" defaultValue="Aug 17 - Aug 23" className="pl-10" />
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-desc">وصف المنتجات التي تنوي عرضها*</Label>
                    <Textarea
                      id="product-desc"
                      placeholder="مثال: منتجات عناية بالبشرة طبيعية - أدوات مكتبية مخصصة للأطفال"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-count">عدد قطع المنتجات بالتقريب*</Label>
                    <Input
                      id="product-count"
                      placeholder="مثال: منتجات عناية بالبشرة طبيعية - أدوات مكتبية مخصصة للأطفال"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
                    <Textarea id="notes" placeholder="مثال: أحتاج رف في مستوى رؤية واضح" />
                  </div>
                  <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p>
                      الموافقة على الطلب تتم من قبل صاحب المحل خلال 48 ساعة كحد أقصى. لا يتم سحب أي مبالغ حتى يتم
                      التفعيل رسمياً.
                    </p>
                  </div>
                  <Button type="submit" size="lg" className="w-full text-base">
                    إرسال الطلب للمراجعة
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={storeDetails.owner.avatar || "/placeholder.svg"} alt={storeDetails.owner.name} />
                    <AvatarFallback>{storeDetails.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{storeDetails.owner.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <p className="text-xs text-muted-foreground">online</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 p-4 bg-muted/30 overflow-y-auto">
                {/* Chat messages */}
                <div className="flex justify-start">
                  <div className="bg-background rounded-lg p-3 max-w-xs">
                    <p className="text-sm">السلام عليكم اريد تفاصيل اكثر عن الرف المتواجد وشكراً جزيلاً</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs">
                    <p className="text-sm">أهلاً وسهلاً بك! 😊 سوف ارسل لك كل المعلومات المتاحه وايضا صور اضافية</p>
                    <Image
                      src="/placeholder.svg?height=150&width=250"
                      alt="shelf"
                      width={250}
                      height={150}
                      className="rounded-md mt-2"
                    />
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-background rounded-lg p-3 max-w-xs">
                    <p className="text-sm">شكرا لك سوف اقدم لك طلب ايجار وسانتظر قبولة</p>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t mt-auto">
                <div className="relative">
                  <Input placeholder="اكتب رسالتك" className="pr-24" />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background mt-16 border-t">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">ش</span>
                </div>
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
