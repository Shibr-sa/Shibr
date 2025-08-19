"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { CalendarDays, Clock, Star, RefreshCw, AlertCircle } from "lucide-react"
import { RenewalDialog } from "@/components/dialogs/renewal-dialog"
import { ReviewDialog } from "@/components/dialogs/review-dialog"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface RentalStatusCardProps {
  rentalRequest: {
    _id: Id<"rentalRequests">
    status: string
    startDate: string
    endDate: string
    monthlyPrice: number
    totalPrice: number
    storeOwnerId: Id<"users">
    brandOwnerId: Id<"users">
  }
  shelfName: string
  storeName: string
  storeOwnerName: string
  currentUserId: Id<"users">
  onUpdate?: () => void
}

export function RentalStatusCard({
  rentalRequest,
  shelfName,
  storeName,
  storeOwnerName,
  currentUserId,
  onUpdate
}: RentalStatusCardProps) {
  const { t, direction } = useLanguage()
  const [showRenewalDialog, setShowRenewalDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  const now = new Date()
  const endDate = new Date(rentalRequest.endDate)
  const startDate = new Date(rentalRequest.startDate)
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const progress = ((totalDays - daysRemaining) / totalDays) * 100

  const isActive = rentalRequest.status === "active"
  const isCompleted = rentalRequest.status === "completed"
  const isExpiringSoon = isActive && daysRemaining <= 7 && daysRemaining > 0
  const isExpired = daysRemaining <= 0

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge variant="secondary">{t("rental.completed")}</Badge>
    }
    if (isExpired && isActive) {
      return <Badge variant="destructive">{t("common.expired")}</Badge>
    }
    if (isExpiringSoon) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
        {t("rental.ending_soon")}
      </Badge>
    }
    if (isActive) {
      return <Badge variant="default" className="bg-green-500">{t("common.active")}</Badge>
    }
    return <Badge variant="outline">{t("common.pending")}</Badge>
  }

  const isBrandOwner = currentUserId === rentalRequest.brandOwnerId
  const revieweeId = isBrandOwner ? rentalRequest.storeOwnerId : rentalRequest.brandOwnerId
  const revieweeName = isBrandOwner ? storeOwnerName : storeName

  return (
    <>
      <Card className={cn(
        "transition-all",
        isExpiringSoon && "border-yellow-500/50",
        isCompleted && "border-gray-300"
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{shelfName}</CardTitle>
              <CardDescription>{storeName}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar for active rentals */}
          {isActive && !isExpired && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("common.progress")}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Rental details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t("common.start_date")}</p>
                <p className="font-medium">{formatDate(rentalRequest.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{t("common.end_date")}</p>
                <p className="font-medium">{formatDate(rentalRequest.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Days remaining alert */}
          {isActive && !isExpired && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              isExpiringSoon ? "bg-yellow-50 text-yellow-700" : "bg-muted"
            )}>
              {isExpiringSoon ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {daysRemaining} {t(daysRemaining === 1 ? "common.day" : "common.days")} {t("common.remaining")}
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("rental.monthly_price")}</span>
              <span className="font-semibold">{formatCurrency(rentalRequest.monthlyPrice)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          {/* Renewal button for expiring active rentals */}
          {isActive && isExpiringSoon && isBrandOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRenewalDialog(true)}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 me-2" />
              {t("rental.renew_rental")}
            </Button>
          )}

          {/* Review button for completed rentals */}
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewDialog(true)}
              className="flex-1"
            >
              <Star className="h-4 w-4 me-2" />
              {t("review.rate_experience")}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Renewal Dialog */}
      <RenewalDialog
        open={showRenewalDialog}
        onOpenChange={setShowRenewalDialog}
        rentalRequestId={rentalRequest._id}
        currentEndDate={rentalRequest.endDate}
        monthlyPrice={rentalRequest.monthlyPrice}
        onSuccess={() => {
          setShowRenewalDialog(false)
          onUpdate?.()
        }}
      />

      {/* Review Dialog */}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        rentalRequestId={rentalRequest._id}
        revieweeId={revieweeId}
        revieweeName={revieweeName}
        onSuccess={() => {
          setShowReviewDialog(false)
          onUpdate?.()
        }}
      />
    </>
  )
}