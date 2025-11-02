import { logger } from "./logger";
import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireAuth } from "./helpers"

// File upload limits and allowed types
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB for images
  document: 10 * 1024 * 1024, // 10MB for documents
  default: 5 * 1024 * 1024, // 5MB default
}

const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "application/msword",
             "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
             "image/jpeg", "image/jpg", "image/png"],
}

// User upload quota tracking (in-memory for now, should be persisted in production)
const uploadQuota = new Map<string, { count: number; resetTime: number }>()

// Check and update user upload quota
function checkUploadQuota(userId: string): boolean {
  const now = Date.now()
  const userQuota = uploadQuota.get(userId)

  // Reset quota after 1 hour
  if (!userQuota || userQuota.resetTime < now) {
    uploadQuota.set(userId, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour from now
    })
    return true
  }

  // Allow max 10 uploads per hour per user
  if (userQuota.count >= 10) {
    return false
  }

  userQuota.count++
  return true
}

// Generate upload URL for file storage with authentication and validation
export const generateUploadUrl = mutation({
  args: {
    fileType: v.optional(v.union(v.literal("image"), v.literal("document"))),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireAuth(ctx)

    // Check upload quota
    if (!checkUploadQuota(userId)) {
      throw new Error("Upload quota exceeded. Please try again later.")
    }

    // Validate file type if provided
    if (args.mimeType && args.fileType) {
      const allowedTypes = ALLOWED_FILE_TYPES[args.fileType]
      if (allowedTypes && !allowedTypes.includes(args.mimeType)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
      }
    }

    // Generate and return the upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl()

    // Log upload request for auditing
    logger.info("File upload URL generated", {
      userId,
      fileType: args.fileType,
      mimeType: args.mimeType,
      timestamp: new Date().toISOString(),
    })

    return uploadUrl
  },
})

// Generate upload URL for signup (unauthenticated)
export const generateSignupUploadUrl = mutation({
  args: {
    fileType: v.optional(v.union(v.literal("image"), v.literal("document"))),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate file type if provided
    if (args.mimeType && args.fileType) {
      const allowedTypes = ALLOWED_FILE_TYPES[args.fileType]
      if (allowedTypes && !allowedTypes.includes(args.mimeType)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
      }
    }

    // Generate and return the upload URL (no auth required for signup)
    const uploadUrl = await ctx.storage.generateUploadUrl()

    return uploadUrl
  },
})

// Get file URL from storage ID (with authentication)
export const getFileUrl = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const userId = await requireAuth(ctx)

    // Validate storage ID format (basic validation)
    if (!args.storageId || typeof args.storageId !== 'string' || args.storageId.length < 10) {
      throw new Error("Invalid storage ID")
    }

    try {
      const url = await ctx.storage.getUrl(args.storageId as any)

      // Log file access for auditing
      logger.info("File URL accessed", {
        userId,
        storageId: args.storageId,
        timestamp: new Date().toISOString(),
      })

      return url
    } catch (error) {
      console.error('Failed to get storage URL:', error)
      // Don't expose internal errors to client
      throw new Error("Failed to retrieve file")
    }
  },
})