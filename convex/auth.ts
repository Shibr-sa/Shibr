import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password({
    profile(params) {
      const profile: any = {
        email: params.email as string,
        name: params.name as string,
        // Profile image is stored in userProfiles for custom uploads
      };
      
      // Only add phone if it's provided
      if (params.phone) {
        profile.phone = params.phone as string;
      }
      
      return profile;
    },
  })],
});