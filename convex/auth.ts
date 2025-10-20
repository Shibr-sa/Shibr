import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTPPasswordReset } from "./authPasswordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({
    profile(params) {
      // Normalize email to lowercase to ensure case-insensitive authentication
      const email = typeof params.email === 'string'
        ? params.email.toLowerCase().trim()
        : params.email;

      const profile: any = {
        email,
        name: params.name as string,
        // Profile image is stored in userProfiles for custom uploads
      };

      // Only add phone if it's provided
      if (params.phone) {
        profile.phone = params.phone as string;
      }

      return profile;
    },
    reset: ResendOTPPasswordReset,
  })],
});