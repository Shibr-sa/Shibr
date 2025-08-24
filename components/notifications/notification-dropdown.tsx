"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertCircle,
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

interface NotificationDropdownProps {
  userId: Id<"users">
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  
  // Fetch notifications
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    {}
  )
  
  // Mark as read mutation
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  
  // Calculate unread count
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0
  
  // Auto-mark as read when dropdown opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      // Mark all as read after a short delay
      const timer = setTimeout(() => {
        markAllAsRead({})
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [open, unreadCount, userId, markAllAsRead])
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_required":
        return <CreditCard className="h-4 w-4 text-orange-600" />
      case "payment_confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "request_accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "request_rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "rental_activated":
        return <Package className="h-4 w-4 text-primary" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id })
    }
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setOpen(false)
    }
  }
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                markAllAsRead({})
              }}
            >
              {t("notifications.mark_all_read")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications && notifications.length > 0 ? (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 cursor-pointer",
                  !notification.isRead && "bg-muted/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, h:mm a",
                        { locale: language === "ar" ? ar : enUS }
                      )}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
                {notification.actionUrl && notification.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNotificationClick(notification)
                    }}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("notifications.no_notifications")}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}