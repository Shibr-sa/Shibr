"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  imageFile: File | null
  onCropComplete: (croppedBlob: Blob) => void
  aspectRatio?: number
  cropShape?: "rect" | "round"
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round"
}: ImageCropperProps) {
  const { t, direction } = useLanguage()
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageUrl, setImageUrl] = useState<string>("")
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return null
    }

    const image = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.imageSmoothingQuality = 'high'

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    )

    // If circular crop, apply circular mask
    if (cropShape === "round") {
      ctx.globalCompositeOperation = 'destination-in'
      ctx.beginPath()
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2,
      )
      ctx.closePath()
      ctx.fill()
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas is empty'))
          }
        },
        imageFile?.type || 'image/jpeg',
        0.95
      )
    })
  }, [completedCrop, imageFile?.type, cropShape])

  const handleSave = async () => {
    const croppedBlob = await getCroppedImg()
    if (croppedBlob) {
      onCropComplete(croppedBlob)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir={direction}>
        <DialogHeader>
          <DialogTitle>{t("image_cropper.title")}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={cropShape === "round"}
              className="max-h-[400px]"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageUrl}
                onLoad={onImageLoad}
                className="max-h-[400px] max-w-full"
              />
            </ReactCrop>
          )}
          
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!completedCrop}>
            {t("image_cropper.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}