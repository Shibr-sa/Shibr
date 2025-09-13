import "server-only";
import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

/**
 * Log with consistent formatting for debugging
 */
function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${prefix} [auth/server] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

/**
 * Get the current user with their profile data
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  log('👤', 'getCurrentUser called');

  const token = await convexAuthNextjsToken();
  if (!token) {
    log('❌', 'No auth token found');
    return null;
  }

  try {
    const user = await fetchQuery(
      api.users.getCurrentUserWithProfile,
      {},
      { token }
    );

    log('✅', 'User fetched successfully', {
      userId: user?._id,
      email: user?.email,
      accountType: user?.accountType
    });

    return user;
  } catch (error) {
    log('❌', 'Error fetching current user', error);
    return null;
  }
}

/**
 * Check if current user's email is verified
 * Uses the proper OTP table check
 */
export async function isEmailVerified() {
  log('🔍', 'isEmailVerified called');

  const token = await convexAuthNextjsToken();
  if (!token) {
    log('❌', 'No auth token for email verification check');
    return false;
  }

  try {
    const verificationStatus = await fetchQuery(
      api.emailVerification.isCurrentUserVerified,
      {},
      { token }
    );

    log('📊', 'Email verification status', verificationStatus);

    // Check if explicitly skipped in development
    if (verificationStatus?.skipped) {
      log('⚠️', 'Email verification skipped (development mode)');
      return true;
    }

    return verificationStatus?.verified || false;
  } catch (error) {
    log('❌', 'Error checking email verification', error);
    return false;
  }
}

/**
 * Get detailed verification status for current user
 * Useful for debugging and detailed checks
 */
export async function getVerificationStatus() {
  log('📋', 'getVerificationStatus called');

  const token = await convexAuthNextjsToken();
  if (!token) {
    log('❌', 'No auth token for verification status');
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
      log('❌', 'User not found for verification status');
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

    log('📊', 'Detailed verification status', {
      userId: user._id,
      ...verificationStatus
    });

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
    log('❌', 'Error getting verification status', error);
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
  log('🛡️', 'requireRole called', { requiredRole: role });

  // Get current user
  const user = await getCurrentUser();
  log('👤', 'Current user in requireRole', {
    email: user?.email,
    accountType: user?.accountType,
    hasUser: !!user
  });

  if (!user) {
    log('🚫', 'No user found, redirecting to /signin');
    redirect("/signin");
  }

  // Check email verification
  log('📧', 'Checking email verification status...');
  const emailVerified = await isEmailVerified();
  log('📊', 'Email verification result', { emailVerified });

  if (!emailVerified) {
    // Check if we should skip verification (development flag)
    const skipVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";
    log('🔧', 'Skip verification flag', { skipVerification });

    if (!skipVerification) {
      log('⚠️', 'Email not verified, redirecting to /verify-email');
      redirect("/verify-email");
    } else {
      log('✅', 'Email verification skipped (development mode)');
    }
  } else {
    log('✅', 'Email is verified');
  }

  // Check role authorization
  if (user.accountType !== role) {
    // Redirect to appropriate dashboard based on actual role
    const redirectPath =
      user.accountType === "store_owner" ? "/store-dashboard" :
      user.accountType === "brand_owner" ? "/brand-dashboard" :
      user.accountType === "admin" ? "/admin-dashboard" : "/";

    log('🔀', 'Role mismatch, redirecting', {
      required: role,
      actual: user.accountType,
      redirectTo: redirectPath
    });

    redirect(redirectPath);
  }

  log('✅', 'All checks passed, user authorized', {
    userId: user._id,
    email: user.email,
    role: user.accountType
  });

  return user;
}

/**
 * Check if user is authenticated (simple check)
 */
export async function isAuthenticated() {
  log('🔐', 'isAuthenticated check');
  const result = await isAuthenticatedNextjs();
  log('🔐', 'isAuthenticated result', { authenticated: result });
  return result;
}

/**
 * Redirect to appropriate dashboard based on user role
 */
export async function redirectToDashboard() {
  log('🏠', 'redirectToDashboard called');

  const user = await getCurrentUser();

  if (!user) {
    log('❌', 'No user for dashboard redirect, going to /signin');
    redirect("/signin");
  }

  // Check email verification first
  const emailVerified = await isEmailVerified();
  if (!emailVerified && process.env.SKIP_EMAIL_VERIFICATION !== "true") {
    log('📧', 'Email not verified, redirecting to /verify-email');
    redirect("/verify-email");
  }

  const dashboardPath =
    user.accountType === "store_owner" ? "/store-dashboard" :
    user.accountType === "brand_owner" ? "/brand-dashboard" :
    user.accountType === "admin" ? "/admin-dashboard" : "/";

  log('🏠', 'Redirecting to dashboard', {
    accountType: user.accountType,
    path: dashboardPath
  });

  redirect(dashboardPath);
}