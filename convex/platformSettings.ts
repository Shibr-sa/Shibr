import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get platform settings (including fee percentage)
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db
      .query("platformSettings")
      .collect()
    
    // Return default values if no settings exist
    if (allSettings.length === 0) {
      return {
        platformFeePercentage: 8, // Default 8%
        minimumShelfPrice: 100,
        maximumDiscountPercentage: 22,
        updatedAt: new Date().toISOString(),
      }
    }
    
    // Convert key-value pairs to object
    const settings: any = {
      platformFeePercentage: 8,
      minimumShelfPrice: 100,
      maximumDiscountPercentage: 22,
      updatedAt: new Date().toISOString(),
    }
    
    for (const setting of allSettings) {
      if (setting.key === "platformFeePercentage" || 
          setting.key === "minimumShelfPrice" || 
          setting.key === "maximumDiscountPercentage") {
        settings[setting.key] = setting.value
      }
      if (setting.updatedAt > settings.updatedAt) {
        settings.updatedAt = setting.updatedAt
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
    // Admin authentication is handled at the API level
    
    // Update or create individual settings
    const settingsToUpdate = [
      { key: "platformFeePercentage", value: args.platformFeePercentage },
      { key: "minimumShelfPrice", value: args.minimumShelfPrice },
      { key: "maximumDiscountPercentage", value: args.maximumDiscountPercentage }
    ].filter(setting => setting.value !== undefined)
    
    const now = Date.now()
    let updated = 0
    let created = 0
    
    for (const setting of settingsToUpdate) {
      // Check if this specific setting exists
      const existingSetting = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first()
      
      if (existingSetting) {
        // Update existing setting
        await ctx.db.patch(existingSetting._id, {
          value: setting.value,
          updatedAt: now,
        })
        updated++
      } else {
        // Create new setting
        await ctx.db.insert("platformSettings", {
          key: setting.key,
          value: setting.value,
          description: `Platform setting for ${setting.key}`,
          updatedAt: now,
        })
        created++
      }
    }
    
    return { 
      success: true, 
      action: updated > 0 ? "updated" : "created", 
      updated, 
      created 
    }
  },
})