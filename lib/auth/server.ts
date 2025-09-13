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
    return null;
  }
}

/**
 * Require a specific role, redirects if not authorized
 * Users only exist if verified (email verification happens before account creation)
 */
export async function requireRole(
  role: "admin" | "store_owner" | "brand_owner"
) {
  // Get current user
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // Check role authorization
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

/**
 * Check if user is authenticated (simple check)
 */
export async function isAuthenticated() {
  const result = await isAuthenticatedNextjs();
  return result;
}

/**
 * Redirect to appropriate dashboard based on user role
 */
export async function redirectToDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const dashboardPath =
    user.accountType === "store_owner" ? "/store-dashboard" :
    user.accountType === "brand_owner" ? "/brand-dashboard" :
    user.accountType === "admin" ? "/admin-dashboard" : "/";

  redirect(dashboardPath);
}