"use client"

import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Save, Settings, Users, Search, Trash2, UserPlus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

export default function SettingsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false)
  
  // Track if we've loaded initial data and previous data
  const [hasInitialData, setHasInitialData] = useState(false)
  const [previousAdminUsers, setPreviousAdminUsers] = useState<any[]>([])
  
  // Debounced search value
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  
  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== "general") params.set("tab", activeTab)
    if (searchQuery) params.set("search", searchQuery)
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [activeTab, searchQuery, pathname, router])
  
  // Fetch data from Convex
  const adminAccess = useQuery(api.admin.verifyAdminAccess)
  const adminProfile = useQuery(api.adminSettings.getCurrentAdminProfile)
  const platformSettings = useQuery(api.adminSettings.getPlatformSettings)
  const adminUsersData = useQuery(api.adminSettings.getAdminUsers, { searchQuery: debouncedSearchQuery })
  const updatePlatformSettings = useMutation(api.admin.updatePlatformSettings)
  const updateAdminProfile = useMutation(api.adminSettings.updateAdminProfile)
  const toggleAdminStatus = useMutation(api.adminSettings.toggleAdminUserStatus)
  const addAdminUser = useMutation(api.adminSettings.addAdminUser)
  const [newAdminData, setNewAdminData] = useState({
    username: "",
    email: "",
    password: "",
    permission: "admin"
  })
  
  // Form state for admin profile
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    currentPassword: "",
    newPassword: "",
  })
  
  // Initialize form when profile data loads
  useEffect(() => {
    if (adminProfile) {
      setProfileForm({
        fullName: adminProfile.fullName || "",
        email: adminProfile.email || "",
        phoneNumber: adminProfile.phoneNumber || "",
        currentPassword: "",
        newPassword: "",
      })
    }
  }, [adminProfile])

  // Use previous data while loading new search results
  const adminUsers = adminUsersData ?? previousAdminUsers
  
  // Track when we have initial data and update previous data
  useEffect(() => {
    if (adminUsersData !== undefined) {
      if (!hasInitialData) {
        setHasInitialData(true)
      }
      if (adminUsersData) {
        setPreviousAdminUsers(adminUsersData)
      }
    }
  }, [adminUsersData, hasInitialData])
  
  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      const result = await updateAdminProfile({
        fullName: profileForm.fullName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      })
      
      if (result.success) {
        toast({
          title: language === "ar" ? "تم الحفظ" : "Saved",
          description: language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully",
        })
        // Clear password fields
        setProfileForm(prev => ({ ...prev, currentPassword: "", newPassword: "" }))
      }
    } catch (error: any) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("admin.settings.title")}</h1>
        <p className="text-muted-foreground">{t("admin.settings.description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{t("admin.settings.general")}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.settings.users")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Platform Logo Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Platform Logo" />
                  <AvatarFallback className="text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-12 w-12"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 text-start flex-1">
                  <h3 className="text-lg font-semibold">{language === "ar" ? "تحميل شعار المنصة" : "Upload Platform Logo"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "أضف شعار المنصة. يُنصح بصورة مربعة بدقة 400x400 بكسل" : "Add platform logo. Square image 400x400px recommended"}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {language === "ar" ? "تغيير الصورة" : "Change Photo"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-start">
                  {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adminName" className="text-start block">
                      {language === "ar" ? "اسم المسؤول" : "Admin Name"}
                    </Label>
                    <Input 
                      id="adminName" 
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="text-start" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-start block">
                      {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </Label>
                    <Input 
                      id="phoneNumber" 
                      type="tel" 
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="+966 5X XXX XXXX" 
                      className="text-start" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-start block">
                      {language === "ar" ? "البريد الإلكتروني" : "Email"}
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="text-start" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-start block">
                      {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                    </Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      placeholder="••••••••" 
                      className="text-start" 
                    />
                  </div>
                </div>
              </div>


              <div className="flex justify-end">
                <Button className="gap-2" onClick={handleSaveProfile}>
                  <Save className="h-4 w-4" />
                  {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">
                {language === "ar" ? "إدارة حسابات المسؤولين" : "Admin Account Management"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "البحث عن مسؤول..." : "Search admin..."}
                    className="w-[300px] ps-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="gap-2" onClick={() => setIsAddAdminDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  {language === "ar" ? "إضافة مسؤول" : "Add Admin"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-12 text-start font-medium">
                        {language === "ar" ? "اسم المستخدم" : "Username"}
                      </TableHead>
                      <TableHead className="h-12 text-start font-medium">
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </TableHead>
                      <TableHead className="h-12 text-start font-medium">
                        {language === "ar" ? "الصلاحية" : "Permission"}
                      </TableHead>
                      <TableHead className="h-12 text-start font-medium">
                        {language === "ar" ? "الحالة" : "Status"}
                      </TableHead>
                      <TableHead className="h-12 text-start font-medium">
                        {language === "ar" ? "الإجراء" : "Action"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((user) => (
                      <TableRow key={user.id} className="h-[72px]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.permission === "super_admin" ? "destructive" : "secondary"}
                            className={user.permission === "super_admin" ? "bg-purple-600 hover:bg-purple-700" : ""}
                          >
                            {user.permission === "super_admin" ? 
                              (language === "ar" ? "مسؤول رئيسي" : "Super Admin") : 
                              (language === "ar" ? "مسؤول" : "Admin")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === "active" ? "default" : "secondary"}
                            className={user.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {user.status === "active" ? 
                              (language === "ar" ? "نشط" : "Active") : 
                              (language === "ar" ? "غير نشط" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={user.permission === "super_admin"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Admin Dialog */}
      <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {language === "ar" ? "إضافة مسؤول جديد" : "Add New Admin"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-start block">
                {language === "ar" ? "اسم المستخدم" : "Username"} *
              </Label>
              <Input
                id="admin-username"
                value={newAdminData.username}
                onChange={(e) => setNewAdminData({...newAdminData, username: e.target.value})}
                placeholder={language === "ar" ? "أدخل اسم المستخدم" : "Enter username"}
                className="w-full"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-start block">
                {language === "ar" ? "البريد الإلكتروني" : "Email"} *
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                placeholder={language === "ar" ? "example@shibr.com" : "example@shibr.com"}
                className="w-full"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-start block">
                {language === "ar" ? "كلمة المرور" : "Password"} *
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                placeholder={language === "ar" ? "أدخل كلمة مرور قوية" : "Enter a strong password"}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل" : "Password must be at least 8 characters"}
              </p>
            </div>

            {/* Permission Level */}
            <div className="space-y-2">
              <Label htmlFor="admin-permission" className="text-start block">
                {language === "ar" ? "مستوى الصلاحية" : "Permission Level"} *
              </Label>
              <Select 
                value={newAdminData.permission} 
                onValueChange={(value) => setNewAdminData({...newAdminData, permission: value})}
              >
                <SelectTrigger id="admin-permission" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    {language === "ar" ? "مسؤول" : "Admin"}
                  </SelectItem>
                  <SelectItem value="super_admin">
                    {language === "ar" ? "مسؤول رئيسي" : "Super Admin"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newAdminData.permission === "super_admin" ? 
                  (language === "ar" ? "المسؤول الرئيسي لديه صلاحيات كاملة على النظام" : "Super Admin has full system privileges") :
                  (language === "ar" ? "المسؤول لديه صلاحيات محدودة" : "Admin has limited privileges")
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddAdminDialogOpen(false)
                setNewAdminData({ username: "", email: "", password: "", permission: "admin" })
              }}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const result = await addAdminUser({
                    email: newAdminData.email,
                    fullName: newAdminData.username,
                    adminRole: newAdminData.permission === "super_admin" ? "super_admin" : "support"
                  })
                  
                  toast({
                    title: language === "ar" ? "تم الإضافة" : "Added",
                    description: result.message,
                    variant: result.success ? "default" : "destructive"
                  })
                  
                  if (result.success) {
                    setIsAddAdminDialogOpen(false)
                    setNewAdminData({ username: "", email: "", password: "", permission: "admin" })
                  }
                } catch (error: any) {
                  toast({
                    title: language === "ar" ? "خطأ" : "Error",
                    description: error.message,
                    variant: "destructive"
                  })
                }
              }}
              disabled={!newAdminData.username || !newAdminData.email || !newAdminData.password || newAdminData.password.length < 8}
            >
              {language === "ar" ? "إضافة مسؤول" : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}