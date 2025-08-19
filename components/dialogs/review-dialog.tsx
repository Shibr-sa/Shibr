"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "@/hooks/use-toast"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentalRequestId: Id<"rentalRequests">
  revieweeId: Id<"users">
  revieweeName: string
  onSuccess?: () => void
}

export function ReviewDialog({
  open,
  onOpenChange,
  rentalRequestId,
  revieweeId,
  revieweeName,
  onSuccess
}: ReviewDialogProps) {
  const { t, direction } = useLanguage()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const submitReview = useMutation(api.rentalManagement.submitReview)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: t("review.select_rating"),
        description: t("review.rating_required"),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await submitReview({
        rentalRequestId,
        rating,
        revieweeId
      })
      
      toast({
        title: t("review.submitted"),
        description: t("review.thank_you"),
      })
      
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setRating(0)
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("review.submit_failed"),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("review.rate_experience")}</DialogTitle>
          <DialogDescription>
            {t("review.rate_experience_with")} {revieweeName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-4 text-sm text-muted-foreground">
              {rating === 5 && t("review.excellent")}
              {rating === 4 && t("review.good")}
              {rating === 3 && t("review.average")}
              {rating === 2 && t("review.poor")}
              {rating === 1 && t("review.terrible")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || rating === 0}>
            {isLoading ? t("common.loading") : t("review.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}