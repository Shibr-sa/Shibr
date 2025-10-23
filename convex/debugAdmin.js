import { query, mutation } from "./_generated/server";

export const checkAdminStatus = query({
  handler: async (ctx) => {
    // Check admin profiles
    const adminProfiles = await ctx.db
      .query("adminProfiles")
      .collect();

    // Check users table for the admin email
    const allUsers = await ctx.db.query("users").collect();
    const adminUser = allUsers.find(u => u.email === "it@shibr.io");

    // Check auth accounts
    let authAccount = null;
    if (adminUser) {
      const authAccounts = await ctx.db
        .query("authAccounts")
        .filter(q => q.eq(q.field("userId"), adminUser._id))
        .collect();
      authAccount = authAccounts[0];
    }

    return {
      adminProfilesCount: adminProfiles.length,
      adminProfiles: adminProfiles,
      adminUserExists: !!adminUser,
      adminUser: adminUser,
      authAccountExists: !!authAccount,
      totalUsers: allUsers.length,
      userEmails: allUsers.map(u => u.email)
    };
  },
});

export const forceCreateAdmin = mutation({
  handler: async (ctx) => {
    const adminEmail = "it@shibr.io";
    const adminPassword = "wwadnj0aw2nc@!!";
    const adminName = "Shibr Admin";

    // Delete any existing user with this email first
    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === adminEmail);

    if (existingUser) {
      // Delete existing admin profile if exists
      const existingProfiles = await ctx.db
        .query("adminProfiles")
        .filter(q => q.eq(q.field("userId"), existingUser._id))
        .collect();

      for (const profile of existingProfiles) {
        await ctx.db.delete(profile._id);
      }

      // Create admin profile for existing user
      const profileId = await ctx.db.insert("adminProfiles", {
        userId: existingUser._id,
        adminRole: "super_admin",
        permissions: ["all"],
        isActive: true,
        department: undefined,
      });

      return {
        success: true,
        message: `Existing user ${adminEmail} promoted to super admin`,
        userId: existingUser._id,
        profileId: profileId
      };
    }

    // Create new user from scratch
    const { sha256 } = await import("@oslojs/crypto/sha2");
    const { encodeBase64 } = await import("@oslojs/encoding");

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(adminPassword);
    const hashedPasswordBuffer = sha256(passwordData);
    const hashedPassword = encodeBase64(hashedPasswordBuffer);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: adminEmail,
      emailVerificationTime: Date.now(),
      name: adminName,
      isAnonymous: false,
    });

    // Create auth account
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: adminEmail,
      secret: hashedPassword,
    });

    // Create admin profile
    const profileId = await ctx.db.insert("adminProfiles", {
      userId,
      adminRole: "super_admin",
      permissions: ["all"],
      isActive: true,
      department: undefined,
    });

    return {
      success: true,
      message: `Admin user created: ${adminEmail}`,
      userId,
      profileId
    };
  },
});