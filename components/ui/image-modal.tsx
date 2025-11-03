"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ImageModalProps {
  images: { url: string; alt?: string }[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageModal({ images, initialIndex = 0, isOpen, onClose }: ImageModalProps) {
  const { direction } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoom(1)
    }
  }, [isOpen, initialIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setZoom(1)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setZoom(1)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1))
  }

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      if (direction === "rtl") {
        handlePrevious()
      } else {
        handleNext()
      }
    }
    if (isRightSwipe) {
      if (direction === "rtl") {
        handleNext()
      } else {
        handlePrevious()
      }
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowLeft") {
        if (direction === "rtl") {
          handleNext()
        } else {
          handlePrevious()
        }
      } else if (e.key === "ArrowRight") {
        if (direction === "rtl") {
          handlePrevious()
        } else {
          handleNext()
        }
      } else if (e.key === "Escape") {
        onClose()
      } else if (e.key === "+") {
        handleZoomIn()
      } else if (e.key === "-") {
        handleZoomOut()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, direction])

  if (!images || images.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full p-0 bg-black/95 border-0">
        <VisuallyHidden>
          <DialogTitle>Image Viewer</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 end-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 start-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 start-1/2 transform -translate-x-1/2 z-50 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute start-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 hidden sm:flex"
              onClick={handlePrevious}
            >
              <ChevronLeft className={`h-8 w-8 ${direction === "rtl" ? "rotate-180" : ""}`} />
            </Button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 hidden sm:flex"
              onClick={handleNext}
            >
              <ChevronRight className={`h-8 w-8 ${direction === "rtl" ? "rotate-180" : ""}`} />
            </Button>
          )}

          {/* Image container */}
          <div
            className="relative w-full h-full overflow-auto flex items-center justify-center p-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <Image
                src={images[currentIndex]?.url || "/placeholder.svg"}
                alt={images[currentIndex]?.alt || "Image"}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain"
                priority
              />
            </div>
          </div>

          {/* Thumbnail navigation for multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-20 start-1/2 transform -translate-x-1/2 z-50 flex gap-2 max-w-full overflow-x-auto px-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-white scale-110"
                      : "border-white/30 hover:border-white/60"
                  }`}
                  onClick={() => {
                    setCurrentIndex(index)
                    setZoom(1)
                  }}
                >
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}