import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get platform settings (including fee percentage)
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("platformSettings")
      .order("desc")
      .first()
    
    // Return default values if no settings exist
    if (!settings) {
      return {
        platformFeePercentage: 8, // Default 8%
        minimumShelfPrice: 100,
        maximumDiscountPercentage: 22,
        updatedAt: new Date().toISOString(),
      }
    }
    
    return settings
  },
})

// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    platformFeePercentage: v.optional(v.number()),
    minimumShelfPrice: v.optional(v.number()),
    maximumDiscountPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    // const identity = await ctx.auth.getUserIdentity()
    // if (!identity || !isAdmin(identity)) {
    //   throw new Error("Unauthorized: Admin access required")
    // }
    
    // Check if settings already exist
    const existingSettings = await ctx.db
      .query("platformSettings")
      .order("desc")
      .first()
    
    const updatedSettings = {
      ...args,
      updatedAt: new Date().toISOString(),
    }
    
    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, updatedSettings)
      return { success: true, action: "updated" }
    } else {
      // Create new settings document
      await ctx.db.insert("platformSettings", {
        platformFeePercentage: args.platformFeePercentage || 8,
        minimumShelfPrice: args.minimumShelfPrice || 100,
        maximumDiscountPercentage: args.maximumDiscountPercentage || 22,
        updatedAt: new Date().toISOString(),
      })
      return { success: true, action: "created" }
    }
  },
})