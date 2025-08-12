"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarDays, Package, MessageSquare, Check, X } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface RentalRequestCardProps {
  request: any // You can define a proper type based on your schema
  onActionComplete?: () => void
}

export function RentalRequestCard({ request, onActionComplete }: RentalRequestCardProps) {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [isAccepting, setIsAccepting] = useState(false)
  
  const acceptRequest = useMutation(api.rentalRequests.acceptRentalRequest)
  const rejectRequest = useMutation(api.rentalRequests.rejectRentalRequest)
  
  const handleAccept = () => {
    setIsAccepting(true)
    setShowResponseDialog(true)
  }
  
  const handleReject = () => {
    setIsAccepting(false)
    setShowResponseDialog(true)
  }
  
  const handleSubmitResponse = async () => {
    try {
      if (isAccepting) {
        await acceptRequest({
          requestId: request._id,
          storeOwnerResponse: responseText,
        })
      } else {
        await rejectRequest({
          requestId: request._id,
          storeOwnerResponse: responseText,
        })
      }
      
      setShowResponseDialog(false)
      setResponseText("")
      
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (error) {
      console.error("Failed to respond to request:", error)
    }
  }
  
  const handleOpenChat = () => {
    if (request.conversationId) {
      router.push(`/store-dashboard/orders?conversation=${request.conversationId}`)
    }
  }
  
  const getStatusBadge = () => {
    switch (request.status) {
      case "pending":
      case "under_discussion":
        return <Badge variant="default">{t("orders.under_review")}</Badge>
      case "accepted":
        return <Badge variant="default" className="bg-green-500">{t("orders.accepted")}</Badge>
      case "rejected":
        return <Badge variant="destructive">{t("orders.rejected")}</Badge>
      default:
        return null
    }
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className={cn(
                "text-lg",
                              )}>
                {request.brandOwnerName || t("common.unknown")}
              </CardTitle>
              <p className={cn(
                "text-sm text-muted-foreground mt-1",
                              )}>
                {request.shelfName}
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t("orders.rental_duration")}</p>
                <p className="font-medium">
                  {format(new Date(request.startDate), "dd MMM", {
                    locale: language === "ar" ? ar : enUS,
                  })} - {format(new Date(request.endDate), "dd MMM", {
                    locale: language === "ar" ? ar : enUS,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t("marketplace.details.product_count")}</p>
                <p className="font-medium">{request.productCount} {t("common.pieces")}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("marketplace.details.product_description")}</p>
            <p className={cn(
              "text-sm text-muted-foreground",
                          )}>
              {request.productDescription}
            </p>
          </div>
          
          {request.additionalNotes && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("marketplace.details.additional_notes")}</p>
              <p className={cn(
                "text-sm text-muted-foreground",
                              )}>
                {request.additionalNotes}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm text-muted-foreground">{t("common.price")}</p>
              <p className="text-lg font-bold text-primary">
                {t("common.currency_symbol")} {request.totalPrice.toLocaleString()}
              </p>
            </div>
            
            {request.status === "under_discussion" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleOpenChat}>
                  <MessageSquare className="h-4 w-4 me-1" />
                  {t("common.chat")}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReject}>
                  <X className="h-4 w-4 me-1" />
                  {t("orders.reject")}
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  <Check className="h-4 w-4 me-1" />
                  {t("orders.accept")}
                </Button>
              </div>
            )}
            
            {request.status !== "under_discussion" && (
              <Button size="sm" variant="outline" onClick={handleOpenChat}>
                <MessageSquare className="h-4 w-4 me-1" />
                {t("common.chat")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAccepting 
                ? t("actions.accept_rental_request")
                : t("actions.reject_rental_request")
              }
            </DialogTitle>
            <DialogDescription>
              {t("form.add_customer_message")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response">
                {t("common.message")}
              </Label>
              <Textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={
                  isAccepting
                    ? t("chat.request_accepted_message")
                    : t("chat.shelf_unavailable_message")
                }
                                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmitResponse} className={isAccepting ? "" : "bg-destructive"}>
              {isAccepting ? t("orders.accept") : t("orders.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}