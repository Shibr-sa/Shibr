import { mutation } from "./_generated/server";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64 } from "@oslojs/encoding";

/**
 * Seeds an initial admin user for the system
 * This should only be used once to create the first admin
 */
export const seedAdminUser = mutation({
  handler: async (ctx) => {
    // Check if any admin exists
    const existingAdmins = await ctx.db
      .query("adminProfiles")
      .collect();

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
    const existingUsers = await ctx.db.query("users").collect();
    const existingUser = existingUsers.find(u => u.email === adminEmail);

    if (existingUser) {
      // Just create admin profile for existing user
      await ctx.db.insert("adminProfiles", {
        userId: existingUser._id,
        adminRole: "super_admin",
        permissions: ["all"],
        isActive: true,
        department: undefined,
      });

      return {
        success: true,
        message: `User ${adminEmail} promoted to super admin`
      };
    }

    // Hash password
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
    await ctx.db.insert("adminProfiles", {
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
    };
  },
});