import { internalAction, internalMutation } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Helper to check existing admins
export const checkExistingAdmins = internalMutation({
  handler: async (ctx) => {
    const existingAdmins = await ctx.db
      .query("adminProfiles")
      .collect();

    return existingAdmins;
  },
});

// Helper to check if user exists
export const checkUserExists = internalMutation({
  handler: async (ctx, { email }: { email: string }) => {
    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === email.toLowerCase());

    return existingUser;
  },
});

// Helper to create admin profile
export const createAdminProfileForUser = internalMutation({
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

/**
 * Seeds an initial admin user for the system
 * This should only be used once to create the first admin
 */
export const seedAdminUser = internalAction({
  handler: async (ctx): Promise<any> => {
    // Check if any admin exists
    const existingAdmins: any = await ctx.runMutation(internal.seedInitialAdmin.checkExistingAdmins);

    if (existingAdmins.length > 0) {
      return {
        success: false,
        message: "Admin users already exist. Cannot seed."
      };
    }

    // Admin credentials
    const adminEmail = "it@shibr.io";
    const adminPassword = "wwadnj0aw2nc@!!";
    const adminName = "Shibr Admin";

    // Check if user exists
    const existingUser: any = await ctx.runMutation(internal.seedInitialAdmin.checkUserExists, { email: adminEmail });

    if (existingUser) {
      // Just create admin profile for existing user
      const profileId: any = await ctx.runMutation(internal.seedInitialAdmin.createAdminProfileForUser, {
        userId: existingUser._id
      });

      return {
        success: true,
        message: `User ${adminEmail} promoted to super admin`,
        userId: existingUser._id,
        profileId
      };
    }

    // Create user using Convex Auth's createAccount API
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

      // Create admin profile
      const profileId: any = await ctx.runMutation(internal.seedInitialAdmin.createAdminProfileForUser, {
        userId: user._id
      });

      return {
        success: true,
        message: `Admin user created: ${adminEmail}`,
        userId: user._id,
        profileId,
      };
    } catch (error) {
      console.error("Error creating admin user:", error);
      return {
        success: false,
        message: `Failed to create admin: ${error}`,
        error: String(error)
      };
    }
  },
});