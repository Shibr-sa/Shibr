import { QueryCtx, MutationCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Helper to get user's profile based on their role
export async function getUserProfile(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  // Check each profile type
  const storeProfile = await ctx.db
    .query("storeProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first()
  
  if (storeProfile) {
    return {
      type: "store_owner" as const,
      profile: storeProfile,
      userId
    }
  }

  const brandProfile = await ctx.db
    .query("brandProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first()
  
  if (brandProfile) {
    return {
      type: "brand_owner" as const,
      profile: brandProfile,
      userId
    }
  }

  const adminProfile = await ctx.db
    .query("adminProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first()
  
  if (adminProfile) {
    return {
      type: "admin" as const,
      profile: adminProfile,
      userId
    }
  }

  return null
}

// Helper to get all users with their profiles
export async function getAllUsersWithProfiles(ctx: QueryCtx | MutationCtx) {
  const users = await ctx.db.query("users").collect()
  
  const usersWithProfiles = await Promise.all(
    users.map(async (user) => {
      const profile = await getUserProfile(ctx, user._id)
      return {
        user,
        profile
      }
    })
  )
  
  return usersWithProfiles.filter(u => u.profile !== null)
}

// Helper to get users by account type
export async function getUsersByAccountType(
  ctx: QueryCtx | MutationCtx,
  accountType: "store_owner" | "brand_owner" | "admin"
) {
  switch (accountType) {
    case "store_owner": {
      const profiles = await ctx.db.query("storeProfiles").collect()
      return Promise.all(
        profiles.map(async (profile) => {
          const user = await ctx.db.get(profile.userId)
          return { user, profile, type: accountType }
        })
      )
    }
    case "brand_owner": {
      const profiles = await ctx.db.query("brandProfiles").collect()
      return Promise.all(
        profiles.map(async (profile) => {
          const user = await ctx.db.get(profile.userId)
          return { user, profile, type: accountType }
        })
      )
    }
    case "admin": {
      const profiles = await ctx.db.query("adminProfiles").collect()
      return Promise.all(
        profiles.map(async (profile) => {
          const user = await ctx.db.get(profile.userId)
          return { user, profile, type: accountType }
        })
      )
    }
  }
}