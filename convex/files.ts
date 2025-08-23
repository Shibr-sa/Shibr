import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl()
})

// Get file URL from storage ID
export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // Check if it's already a URL (legacy data)
    if (args.storageId.startsWith('http://') || args.storageId.startsWith('https://')) {
      return args.storageId
    }
    
    // Otherwise, get URL from storage
    try {
      return await ctx.storage.getUrl(args.storageId as any)
    } catch (error) {
      console.error('Failed to get storage URL:', error)
      return null
    }
  },
})