"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, MessageSquare, CheckCircle, XCircle, Package, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMutation } from "convex/react"

interface NotificationBellProps {
  userId: Id<"users">
  userType: "store-owner" | "brand-owner"
}

export function NotificationBell({ userId, userType }: NotificationBellProps) {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  
  // Fetch notifications (exclude message notifications for brand owners since they have chat FAB)
  const excludeMessages = userType === "brand-owner"
  
  const notifications = useQuery(api.notifications.getUserNotifications, { 
    limit: 20,
    excludeMessageNotifications: excludeMessages
  })
  
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    excludeMessageNotifications: excludeMessages
  })
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  
  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Convex will automatically refetch
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id })
    }
    
    // Navigate based on notification type
    if (notification.type === "new_message" && notification.conversationId) {
      // Navigate to orders page with conversation
      if (userType === "store-owner") {
        router.push(`/store-dashboard/orders?conversation=${notification.conversationId}`)
      } else {
        router.push(`/brand-dashboard/shelves?conversation=${notification.conversationId}`)
      }
    } else if (notification.type === "rental_request" && notification.rentalRequestId) {
      // Navigate to rental request
      if (userType === "store-owner") {
        router.push(`/store-dashboard/orders?request=${notification.rentalRequestId}`)
      }
    }
    
    setIsOpen(false)
  }
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead({})
  }
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message":
        return <MessageSquare className="h-4 w-4" />
      case "rental_request":
        return <Package className="h-4 w-4 text-amber-600" />
      case "rental_accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rental_rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={direction === "rtl" ? "start" : "end"} 
        className="w-80"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>
            {t("notifications.title")}
          </span>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              {t("notifications.mark_all_read")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.isRead && "bg-muted/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: language === "ar" ? ar : enUS,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {t("notifications.no_notifications")}
              </p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}