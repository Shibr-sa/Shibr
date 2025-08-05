"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function SettingsPage() {
  const { t, direction } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6" dir={direction}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="brand">{t("settings.brand")}</TabsTrigger>
          <TabsTrigger value="payment">{t("settings.payment")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile" />
                  <AvatarFallback>
                    <Camera className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    {t("common.upload")}
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("settings.name_placeholder")}
                    defaultValue="محمد أحمد"
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("settings.email_placeholder")}
                    defaultValue="mohamed@example.com"
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">{t("settings.mobile")}</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder={t("settings.mobile_placeholder")}
                    defaultValue="+966 50 123 4567"
                    dir={direction}
                  />
                </div>
              </div>

              <Button className="w-full md:w-auto">{t("settings.save_changes")}</Button>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.change_password")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{t("settings.password_description")}</p>
              <Button variant="outline">{t("settings.change_password")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.brand")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Brand settings content will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.payment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment settings content will be here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
