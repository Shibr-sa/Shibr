/**
 * Validation schemas and utilities using Zod.
 * Provides consistent validation across the application.
 */

import { z } from 'zod'

// ============================================
// Email & Authentication Validations
// ============================================

export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(100, 'Email too long')
  .transform(email => email.toLowerCase().trim())

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  )

export const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'Name can only contain letters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  accountType: z.enum(['store-owner', 'brand-owner']),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept terms')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required')
})

// ============================================
// Phone Number Validations
// ============================================

export const saudiPhoneSchema = z.string()
  .regex(/^(05\d{8}|5\d{8}|\+9665\d{8}|9665\d{8})$/, 'Invalid Saudi phone number')
  .transform(phone => {
    // Normalize to 05XXXXXXXX format
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.startsWith('+966')) return '0' + cleaned.slice(4)
    if (cleaned.startsWith('966')) return '0' + cleaned.slice(3)
    if (cleaned.startsWith('5')) return '0' + cleaned
    return cleaned
  })

export const internationalPhoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number')
  .transform(phone => phone.replace(/[\s\-\(\)]/g, ''))

// ============================================
// Store & Business Validations
// ============================================

export const storeNameSchema = z.string()
  .min(2, 'Store name must be at least 2 characters')
  .max(100, 'Store name too long')
  .regex(/^[a-zA-Z0-9\s\u0600-\u06FF\-\.]+$/, 'Invalid store name format')

export const commercialRecordSchema = z.string()
  .regex(/^\d{10}$/, 'Commercial record must be 10 digits')

export const vatNumberSchema = z.string()
  .regex(/^\d{15}$/, 'VAT number must be 15 digits')

export const storeDataSchema = z.object({
  storeName: storeNameSchema,
  storeType: z.string().min(1, 'Store type required'),
  commercialRecord: commercialRecordSchema,
  vatNumber: vatNumberSchema.optional(),
  phoneNumber: saudiPhoneSchema,
  email: emailSchema,
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  city: z.string().min(1, 'City required'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address too long')
})

// ============================================
// Shelf & Product Validations
// ============================================

export const priceSchema = z.number()
  .positive('Price must be positive')
  .max(1000000, 'Price too high')
  .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'))
  .transform(val => typeof val === 'string' ? parseFloat(val) : val)

export const percentageSchema = z.number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100%')
  .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid percentage format'))
  .transform(val => typeof val === 'string' ? parseFloat(val) : val)

export const dimensionSchema = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Invalid dimension format')
  .transform(val => parseFloat(val))

export const shelfSchema = z.object({
  shelfName: z.string()
    .min(2, 'Shelf name must be at least 2 characters')
    .max(100, 'Shelf name too long'),
  city: z.string().min(1, 'City required'),
  branch: z.string()
    .min(2, 'Branch name must be at least 2 characters')
    .max(100, 'Branch name too long'),
  monthlyPrice: priceSchema,
  discountPercentage: percentageSchema,
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  length: dimensionSchema,
  width: dimensionSchema,
  depth: dimensionSchema,
  productType: z.string().max(100, 'Product type too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

// ============================================
// Rental Request Validations
// ============================================

export const rentalDurationSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

export const rentalRequestSchema = z.object({
  shelfId: z.string(),
  brandId: z.string(),
  duration: rentalDurationSchema,
  message: z.string().max(500, 'Message too long').optional(),
  proposedPrice: priceSchema.optional()
})

// ============================================
// Chat & Message Validations
// ============================================

export const chatMessageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message too long')
  .transform(msg => msg.trim())

export const chatAttachmentSchema = z.object({
  fileName: z.string().max(255, 'File name too long'),
  fileSize: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  fileType: z.string()
})

// ============================================
// Search & Filter Validations
// ============================================

export const searchQuerySchema = z.string()
  .max(100, 'Search query too long')
  .transform(query => query.trim())

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
}).refine(data => new Date(data.to) >= new Date(data.from), {
  message: 'End date must be after or equal to start date',
  path: ['to']
})

// ============================================
// Platform Settings Validations
// ============================================

export const platformSettingsSchema = z.object({
  brandSalesCommission: percentageSchema,
  storeRentCommission: percentageSchema,
  minimumRentalDuration: z.number().int().positive().max(365),
  maximumRentalDuration: z.number().int().positive().max(1825),
  maintenanceMode: z.boolean(),
  allowNewRegistrations: z.boolean()
})

// ============================================
// Utility Functions
// ============================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.issues.forEach((err: any) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return { success: false, errors }
}

/**
 * Create a partial schema for updates (all fields optional)
 */
export function createUpdateSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  const shape = schema.shape
  const partialShape: any = {}
  
  for (const key in shape) {
    const field = shape[key] as any
    partialShape[key] = field.optional()
  }
  
  return z.object(partialShape) as any
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
  } = options
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit` 
    }
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' }
  }
  
  return { valid: true }
}

// ============================================
// Type Exports
// ============================================

export type SignupData = z.infer<typeof signupSchema>
export type SigninData = z.infer<typeof signinSchema>
export type StoreData = z.infer<typeof storeDataSchema>
export type ShelfData = z.infer<typeof shelfSchema>
export type RentalRequestData = z.infer<typeof rentalRequestSchema>
export type PlatformSettings = z.infer<typeof platformSettingsSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
export type Pagination = z.infer<typeof paginationSchema>