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
 * Check if current user's email is verified
 * Uses the proper OTP table check
 */
export async function isEmailVerified() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return false;
  }

  try {
    const verificationStatus = await fetchQuery(
      api.emailVerification.isCurrentUserVerified,
      {},
      { token }
    );

    // Check if explicitly skipped in development
    if (verificationStatus?.skipped) {
      return true;
    }

    return verificationStatus?.verified || false;
  } catch (error) {
    return false;
  }
}

/**
 * Get detailed verification status for current user
 * Useful for debugging and detailed checks
 */
export async function getVerificationStatus() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return {
      isAuthenticated: false,
      isVerified: false,
      needsVerification: false,
      error: "Not authenticated"
    };
  }

  try {
    // Get current user first
    const user = await fetchQuery(
      api.users.getCurrentUser,
      {},
      { token }
    );

    if (!user) {
      return {
        isAuthenticated: false,
        isVerified: false,
        needsVerification: false,
        error: "User not found"
      };
    }

    // Check verification status
    const verificationStatus = await fetchQuery(
      api.emailVerification.checkVerificationStatus,
      { userId: user._id },
      { token }
    );

    return {
      isAuthenticated: true,
      isVerified: verificationStatus?.verified || false,
      needsVerification: !verificationStatus?.verified,
      hasPendingOTP: verificationStatus?.hasPendingOTP,
      otpExpiresAt: verificationStatus?.otpExpiresAt,
      userId: user._id,
      email: user.email
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      isVerified: false,
      needsVerification: false,
      error: "Failed to check verification status"
    };
  }
}

/**
 * Require a specific role, redirects if not authorized
 * Also checks email verification status
 */
export async function requireRole(
  role: "admin" | "store_owner" | "brand_owner"
) {
  // Get current user
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

  // Check email verification first
  const emailVerified = await isEmailVerified();
  if (!emailVerified && process.env.SKIP_EMAIL_VERIFICATION !== "true") {
    redirect("/verify-email");
  }

  const dashboardPath =
    user.accountType === "store_owner" ? "/store-dashboard" :
    user.accountType === "brand_owner" ? "/brand-dashboard" :
    user.accountType === "admin" ? "/admin-dashboard" : "/";

  redirect(dashboardPath);
}