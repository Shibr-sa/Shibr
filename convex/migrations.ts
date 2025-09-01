import { internalMutation } from "./_generated/server"

// Migration to remove brandType field from brandProfiles
export const removeBrandTypeField = internalMutation({
  handler: async (ctx) => {
    const brandProfiles = await ctx.db.query("brandProfiles").collect()
    
    let updatedCount = 0
    for (const profile of brandProfiles) {
      // Check if profile has brandType field
      if ('brandType' in profile) {
        const { brandType, ...profileWithoutBrandType } = profile as any
        
        // Update the profile without the brandType field
        await ctx.db.replace(profile._id, profileWithoutBrandType)
        updatedCount++
      }
    }
    
    return { 
      success: true, 
      updatedCount,
      message: `Removed brandType field from ${updatedCount} brand profiles`
    }
  },
})