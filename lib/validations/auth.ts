import { z } from "zod"

// Saudi phone number validation (must start with 5 and be 9 digits)
const saudiPhoneRegex = /^5[0-9]{8}$/

// Create the schema with translated messages
export const createSignUpSchema = (t: (key: string) => string) => {
  return z.object({
    fullName: z.string()
      .min(1, t("validation.full_name_required"))
      .min(2, t("validation.full_name_min_length")),
    email: z.string()
      .min(1, t("validation.email_required"))
      .email(t("validation.email_invalid")),
    phoneNumber: z.string()
      .min(1, t("validation.phone_required"))
      .regex(saudiPhoneRegex, t("validation.phone_invalid")),
    password: z.string()
      .min(1, t("validation.password_required"))
      .min(8, t("validation.password_min_length"))
      .regex(/[A-Z]/, t("validation.password_uppercase"))
      .regex(/[a-z]/, t("validation.password_lowercase"))
      .regex(/[0-9]/, t("validation.password_number")),
    accountType: z.enum(["store-owner", "brand-owner"]),
    storeName: z.string().optional(),
    brandName: z.string().optional(),
    agreeToTerms: z.boolean().refine(val => val === true, t("validation.terms_required")),
  }).refine(data => {
    if (data.accountType === "store-owner") {
      return data.storeName && data.storeName.trim().length > 0
    }
    if (data.accountType === "brand-owner") {
      return data.brandName && data.brandName.trim().length > 0
    }
    return true
  }, {
    message: t("validation.store_name_required"),
    path: ["storeName"],
  }).refine(data => {
    if (data.accountType === "brand-owner") {
      return data.brandName && data.brandName.trim().length > 0
    }
    return true
  }, {
    message: t("validation.brand_name_required"),
    path: ["brandName"],
  })
}

// Keep the old schema for backward compatibility (using English messages)
export const signUpSchema = z.object({
  fullName: z.string().min(1, "Full name is required").min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(saudiPhoneRegex, "Invalid Saudi phone number"),
  password: z.string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  accountType: z.enum(["store-owner", "brand-owner"]),
  storeName: z.string().optional(),
  brandName: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
}).refine(data => {
  if (data.accountType === "store-owner") {
    return data.storeName && data.storeName.trim().length > 0
  }
  if (data.accountType === "brand-owner") {
    return data.brandName && data.brandName.trim().length > 0
  }
  return true
}, {
  message: "Store name is required for store owners",
  path: ["storeName"],
}).refine(data => {
  if (data.accountType === "brand-owner") {
    return data.brandName && data.brandName.trim().length > 0
  }
  return true
}, {
  message: "Brand name is required for brand owners",
  path: ["brandName"],
})

export function formatSaudiPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If starts with 966, remove it
  if (digits.startsWith('966')) {
    return digits.substring(3)
  }
  
  // If starts with 0, remove it
  if (digits.startsWith('0')) {
    return digits.substring(1)
  }
  
  return digits
}

export function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
  let score = 0
  const feedback: string[] = []
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) {
    score++
    feedback.push("Contains special characters ✓")
  }
  
  if (password.length < 8) feedback.push("At least 8 characters required")
  if (!/[A-Z]/.test(password)) feedback.push("Add uppercase letters")
  if (!/[a-z]/.test(password)) feedback.push("Add lowercase letters")
  if (!/[0-9]/.test(password)) feedback.push("Add numbers")
  
  return { score, feedback }
}