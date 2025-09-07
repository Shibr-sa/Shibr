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
 * Require a specific role, redirects if not authorized
 */
export async function requireRole(
  role: "admin" | "store_owner" | "brand_owner"
) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/signin");
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