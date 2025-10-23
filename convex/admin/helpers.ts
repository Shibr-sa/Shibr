import { getAuthUserId } from "@convex-dev/auth/server"
import { getUserProfile } from "../profileHelpers"
import { QueryCtx, MutationCtx } from "../_generated/server"
import { Doc } from "../_generated/dataModel"

// Helper function to verify admin access without throwing errors
export async function verifyAdminAccess(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      userId: null,
      adminProfile: null
    }
  }

  const userProfile = await getUserProfile(ctx, userId)
  const isAdmin = userProfile?.type === "admin"
  const adminProfile = isAdmin ? userProfile.profile as Doc<"adminProfiles"> : null

  return {
    isAuthenticated: true,
    isAdmin,
    userId,
    adminProfile
  }
}
