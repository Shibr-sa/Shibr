"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ImageIcon, Upload, X } from "lucide-react"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  code: z.string().min(1, "Product code is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerId: Id<"users">
  product?: any // For edit mode
  mode?: "create" | "edit"
}

export function ProductDialog({
  open,
  onOpenChange,
  ownerId,
  product,
  mode = "create",
}: ProductDialogProps) {
  const { t, language, direction } = useLanguage()
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createProduct = useMutation(api.products.createProduct)
  const updateProduct = useMutation(api.products.updateProduct)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      code: product?.code || "",
      price: product?.price || 0,
      quantity: product?.quantity || 0,
      description: product?.description || "",
    },
  })

  // Reset form when dialog opens/closes or when product changes
  React.useEffect(() => {
    if (open) {
      // When dialog opens, set values based on mode
      if (product && mode === "edit") {
        form.reset({
          name: product.name || "",
          code: product.code || "",
          price: product.price || 0,
          quantity: product.quantity || 0,
          description: product.description || "",
        })
        setImagePreview(product.imageUrl || null)
      } else {
        // Create mode - reset to empty
        form.reset({
          name: "",
          code: "",
          price: 0,
          quantity: 0,
          description: "",
        })
        setImagePreview(null)
      }
    } else {
      // When dialog closes, reset everything
      form.reset({
        name: "",
        code: "",
        price: 0,
        quantity: 0,
        description: "",
      })
      setImagePreview(null)
      setIsSubmitting(false)
    }
  }, [open, product, mode, form])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("نوع الصورة غير صالح. يرجى استخدام JPG أو PNG")
        e.target.value = "" // Reset input value
        return
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت")
        e.target.value = "" // Reset input value
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = ""
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true)

      if (mode === "edit" && product) {
        await updateProduct({
          productId: product._id,
          name: data.name,
          code: data.code,
          price: data.price,
          quantity: data.quantity,
          description: data.description,
          imageUrl: imagePreview || undefined,
        })
        toast.success("تم تحديث المنتج بنجاح")
      } else {
        await createProduct({
          ownerId,
          name: data.name,
          code: data.code,
          price: data.price,
          quantity: data.quantity,
          description: data.description,
          imageUrl: imagePreview || undefined,
          currency: "SAR",
        })
        toast.success("تم إضافة المنتج بنجاح")
      }

      // Close dialog - the useEffect will handle resetting everything
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("فشل في حفظ المنتج. يرجى المحاولة مرة أخرى")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={direction}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === "edit" 
              ? t("brand.products.edit_product")
              : t("brand.products.add_new_product")
            }
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("brand.products.product_image")}
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -end-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{t("common.upload")}</span>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("brand.products.image_hint")}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand.products.product_name")} *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={t("brand.products.product_name_placeholder")}
                      dir={direction}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand.products.product_code")} *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="#14821"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand.products.price")} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="pe-12"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {t("common.currency")}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand.products.quantity")} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("brand.products.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("brand.products.description_placeholder")}
                      className="resize-none h-20"
                      dir={direction}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("common.saving")
                : mode === "edit"
                ? t("common.save_changes")
                : t("brand.products.save_product")
              }
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}