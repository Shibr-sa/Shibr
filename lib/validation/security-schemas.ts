import { z } from "zod"

/**
 * Security-focused validation schemas for input sanitization
 */

// Sanitize HTML and prevent XSS
const sanitizeString = (str: string): string => {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Common string validation with sanitization
export const safeStringSchema = z.string()
  .min(1, "Field is required")
  .max(500, "Field is too long")
  .transform(sanitizeString)

// Safe text area validation (longer text)
export const safeTextSchema = z.string()
  .min(1, "Field is required")
  .max(5000, "Text is too long")
  .transform(sanitizeString)

// Email validation with normalization
export const emailSchema = z.string()
  .email("Invalid email format")
  .toLowerCase()
  .trim()
  .max(254, "Email is too long") // RFC 5321

// Phone number validation (Saudi format)
export const phoneSchema = z.string()
  .regex(/^(05|5)[0-9]{8}$/, "Invalid Saudi phone number format")
  .transform(phone => {
    // Ensure consistent format
    return phone.startsWith("0") ? phone : "0" + phone
  })

// URL validation
export const urlSchema = z.string()
  .url("Invalid URL format")
  .max(2048, "URL is too long")
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Only allow http and https protocols
      return ["http:", "https:"].includes(parsed.protocol)
    } catch {
      return false
    }
  }, "Invalid URL protocol")

// File name validation (prevent path traversal)
export const fileNameSchema = z.string()
  .min(1, "File name is required")
  .max(255, "File name is too long")
  .regex(/^[a-zA-Z0-9._-]+$/, "Invalid file name format")
  .refine(name => {
    // Prevent path traversal
    return !name.includes("..") && !name.includes("/") && !name.includes("\\")
  }, "Invalid file name")

// Amount validation (for payments)
export const amountSchema = z.number()
  .positive("Amount must be positive")
  .finite("Amount must be a valid number")
  .max(1000000, "Amount exceeds maximum limit")
  .transform(amount => {
    // Round to 2 decimal places
    return Math.round(amount * 100) / 100
  })

// Saudi Commercial Registration number
export const commercialRegNumberSchema = z.string()
  .regex(/^[12][0-9]{9}$/, "Invalid commercial registration number")

// IBAN validation (Saudi format)
export const ibanSchema = z.string()
  .regex(/^SA[0-9]{22}$/, "Invalid Saudi IBAN format")
  .toUpperCase()

// Location coordinates validation
export const coordinatesSchema = z.object({
  lat: z.number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),
  lng: z.number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
})

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.date()
    .refine(date => date >= new Date(2020, 0, 1), "Date is too far in the past"),
  endDate: z.date()
    .refine(date => date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "Date is too far in the future"),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .max(10000, "Page number is too large")
    .default(1),
  limit: z.number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
})

// Search query validation
export const searchQuerySchema = z.string()
  .transform(query => {
    // Remove special regex characters that could cause issues
    return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  })
  .refine(query => query.length <= 100, {
    message: "Search query is too long"
  })

// Product data validation
export const productSchema = z.object({
  name: safeStringSchema,
  description: safeTextSchema.optional(),
  price: amountSchema,
  quantity: z.number().int().min(0).max(10000),
  category: safeStringSchema,
  images: z.array(fileNameSchema).max(10, "Too many images"),
})

// Shelf data validation
export const shelfSchema = z.object({
  name: safeStringSchema,
  description: safeTextSchema.optional(),
  dimensions: z.object({
    width: z.number().positive().max(1000),
    height: z.number().positive().max(1000),
    depth: z.number().positive().max(1000),
  }),
  pricePerMonth: amountSchema,
  location: z.object({
    city: safeStringSchema,
    area: safeStringSchema,
    coordinates: coordinatesSchema.optional(),
  }),
})

// Payment data validation
export const paymentSchema = z.object({
  amount: amountSchema,
  currency: z.enum(["SAR", "USD", "EUR"]).default("SAR"),
  description: safeTextSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional()
    .refine(metadata => {
      // Ensure metadata doesn't contain sensitive data
      if (!metadata) return true
      const sensitiveKeys = ["password", "secret", "token", "key", "cvv"]
      return !Object.keys(metadata).some(key =>
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
      )
    }, "Metadata contains potentially sensitive data"),
})

// User profile update validation
export const userProfileUpdateSchema = z.object({
  name: safeStringSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  storeName: safeStringSchema.optional(),
  brandName: safeStringSchema.optional(),
  website: urlSchema.optional(),
  commercialRegisterNumber: commercialRegNumberSchema.optional(),
})

// Bank account validation
export const bankAccountSchema = z.object({
  bankName: safeStringSchema,
  accountHolderName: safeStringSchema,
  accountNumber: z.string()
    .regex(/^[0-9]{10,20}$/, "Invalid account number"),
  iban: ibanSchema,
})

// Order validation
export const orderSchema = z.object({
  customerName: safeStringSchema,
  customerPhone: phoneSchema,
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive().max(100),
  })).min(1, "At least one product is required"),
  totalAmount: amountSchema,
})

// Message/Chat validation
export const messageSchema = z.object({
  content: safeTextSchema.refine(text => text.length <= 1000, {
    message: "Message is too long"
  }),
  conversationId: z.string(),
})

/**
 * Helper function to validate and sanitize input
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
      const firstError = issues[0]
      return {
        success: false,
        error: firstError?.message || "Validation failed"
      }
    }
    return {
      success: false,
      error: "Invalid input"
    }
  }
}

/**
 * SQL injection prevention helper
 * Use parameterized queries instead of string concatenation
 */
export function escapeSqlIdentifier(identifier: string): string {
  // Remove or escape potentially dangerous characters
  return identifier.replace(/[^a-zA-Z0-9_]/g, "")
}

/**
 * Prevent NoSQL injection by sanitizing MongoDB operators
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== "object" || query === null) {
    return query
  }

  const sanitized: any = {}
  for (const key in query) {
    // Remove keys that start with $ (MongoDB operators)
    if (!key.startsWith("$")) {
      sanitized[key] = query[key]
    }
  }
  return sanitized
}