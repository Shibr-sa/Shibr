import { mutation } from "./_generated/server";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64 } from "@oslojs/encoding";

export const forceSeedAdmin = mutation({
  handler: async (ctx) => {
    const adminEmail = "it@shibr.io";
    const adminPassword = "wwadnj0aw2nc@!!";
    const adminName = "Shibr Admin";

    // Check if user exists
    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === adminEmail);

    let userId;

    if (existingUser) {
      userId = existingUser._id;
      console.log("Found existing user:", userId);

      // Delete any existing admin profiles for this user
      const existingProfiles = await ctx.db
        .query("adminProfiles")
        .collect();

      const userProfiles = existingProfiles.filter(p => p.userId === userId);
      for (const profile of userProfiles) {
        await ctx.db.delete(profile._id);
      }
    } else {
      // Create new user
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(adminPassword);
      const hashedPasswordBuffer = sha256(passwordData);
      const hashedPassword = encodeBase64(hashedPasswordBuffer);

      userId = await ctx.db.insert("users", {
        email: adminEmail,
        emailVerificationTime: Date.now(),
        name: adminName,
        isAnonymous: false,
      });

      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: adminEmail,
        secret: hashedPassword,
      });

      console.log("Created new user:", userId);
    }

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
      message: `Admin created/updated successfully`,
      userId,
      profileId,
      email: adminEmail
    };
  },
});