import "server-only";
import { 
  convexAuthNextjsToken, 
  isAuthenticatedNextjs 
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

/**
 * Get the current user with their profile data
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  
  try {
    const user = await fetchQuery(
      api.users.getCurrentUserWithProfile,
      {},
      { token }
    );
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Check if current user's email is verified
 */
export async function isEmailVerified() {
  const token = await convexAuthNextjsToken();
  if (!token) return false;

  try {
    const verificationStatus = await fetchQuery(
      api.emailVerification.isCurrentUserVerified,
      {},
      { token }
    );
    return verificationStatus?.verified || false;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
}

/**
 * Require a specific role, redirects if not authorized
 */
export async function requireRole(
  role: "admin" | "store_owner" | "brand_owner"
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // Check email verification
  const emailVerified = await isEmailVerified();
  if (!emailVerified) {
    // Check if we should skip verification (development flag)
    const skipVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";
    if (!skipVerification) {
      redirect("/verify-email");
    }
  }

  if (user.accountType !== role) {
    // Redirect to appropriate dashboard based on actual role
    const redirectPath =
      user.accountType === "store_owner" ? "/store-dashboard" :
      user.accountType === "brand_owner" ? "/brand-dashboard" :
      user.accountType === "admin" ? "/admin-dashboard" : "/";

    redirect(redirectPath);
  }

  return user;
}