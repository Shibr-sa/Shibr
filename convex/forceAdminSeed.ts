import { internalAction, internalMutation, mutation } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Helper to check if user exists and get admin profile
export const checkAdminUser = internalMutation({
  handler: async (ctx) => {
    const adminEmail = "it@shibr.io";

    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === adminEmail.toLowerCase());

    if (!existingUser) {
      return { exists: false, user: null, adminProfile: null };
    }

    const adminProfiles = await ctx.db
      .query("adminProfiles")
      .collect();

    const userAdminProfile = adminProfiles.find(p => p.userId === existingUser._id);

    return {
      exists: true,
      user: existingUser,
      adminProfile: userAdminProfile
    };
  },
});

// Helper to create admin profile
export const createAdminProfile = internalMutation({
  handler: async (ctx, { userId }: { userId: any }) => {
    const profileId = await ctx.db.insert("adminProfiles", {
      userId: userId as any,
      adminRole: "super_admin",
      permissions: ["all"],
      isActive: true,
      department: undefined,
    });

    return profileId;
  },
});

export const forceSeedAdmin = internalAction({
  handler: async (ctx): Promise<any> => {
    const adminEmail = "it@shibr.io";
    const adminPassword = "wwadnj0aw2nc@!!";
    const adminName = "Shibr Admin";

    // Check if user exists
    const check: any = await ctx.runMutation(internal.forceAdminSeed.checkAdminUser);

    let userId;
    let profileId;

    if (check.exists && check.user) {
      userId = check.user._id;
      console.log("Found existing user:", userId);

      // Create admin profile if it doesn't exist
      if (!check.adminProfile) {
        profileId = await ctx.runMutation(internal.forceAdminSeed.createAdminProfile, { userId });
        console.log("Created admin profile for existing user");
      } else {
        profileId = check.adminProfile._id;
        console.log("User already has admin profile");
      }

      return {
        success: true,
        message: `Admin profile ${check.adminProfile ? 'already exists' : 'created'} for existing user`,
        userId,
        profileId,
        email: adminEmail
      };
    } else {
      // Create new user using Convex Auth's createAccount API
      // This automatically handles password hashing with Scrypt
      try {
        const { user, account } = await createAccount(ctx, {
          provider: "password",
          account: {
            id: adminEmail.toLowerCase(),
            secret: adminPassword, // Plain password - will be hashed automatically
          },
          profile: {
            email: adminEmail.toLowerCase(),
            emailVerificationTime: Date.now(),
            name: adminName,
            isAnonymous: false,
          },
        });

        console.log("Created new user:", user._id);

        // Create admin profile
        profileId = await ctx.runMutation(internal.forceAdminSeed.createAdminProfile, { userId: user._id });

        return {
          success: true,
          message: `Admin created/updated successfully`,
          userId: user._id,
          profileId,
          email: adminEmail
        };
      } catch (error) {
        console.error("Error creating admin:", error);
        return {
          success: false,
          message: `Failed to create admin: ${error}`,
          error: String(error)
        };
      }
    }
  },
});

// Helper to clean up old admin user (use this to delete incorrectly created admin)
// Note: This is a regular mutation (not internal) so it can be called from CLI
export const cleanupOldAdmin = mutation({
  handler: async (ctx) => {
    const adminEmail = "it@shibr.io";

    // Find user
    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === adminEmail.toLowerCase());

    if (!existingUser) {
      return { success: false, message: "No admin user found to clean up" };
    }

    const userId = existingUser._id;

    // Delete admin profiles
    const adminProfiles = await ctx.db.query("adminProfiles").collect();
    const userProfiles = adminProfiles.filter(p => p.userId === userId);
    for (const profile of userProfiles) {
      await ctx.db.delete(profile._id);
    }

    // Delete auth accounts
    const authAccounts = await ctx.db.query("authAccounts").collect();
    const userAuthAccounts = authAccounts.filter(a => a.userId === userId);
    for (const account of userAuthAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions
    const authSessions = await ctx.db.query("authSessions").collect();
    const userSessions = authSessions.filter(s => s.userId === userId);
    for (const session of userSessions) {
      await ctx.db.delete(session._id);
    }

    // Delete user
    await ctx.db.delete(userId);

    return {
      success: true,
      message: `Cleaned up admin user ${adminEmail}`,
      deletedProfiles: userProfiles.length,
      deletedAuthAccounts: userAuthAccounts.length,
      deletedSessions: userSessions.length
    };
  },
});