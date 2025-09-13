import { 
  convexAuthNextjsMiddleware, 
  createRouteMatcher,
  nextjsMiddlewareRedirect 
} from "@convex-dev/auth/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/signin",
  "/signup",
  "/signup/select-type",
  "/verify-email", // Email verification page
  "/marketplace",
  "/marketplace/(.*)",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/contact",
  "/api/auth", // Auth callback route
  "/api/auth/(.*)"
]);

// Define protected route patterns
const isAdminRoute = createRouteMatcher(["/admin-dashboard", "/admin-dashboard/(.*)"]);
const isStoreRoute = createRouteMatcher(["/store-dashboard", "/store-dashboard/(.*)"]);
const isBrandRoute = createRouteMatcher(["/brand-dashboard", "/brand-dashboard/(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    // If user is authenticated and trying to access signin/signup, redirect to dashboard
    if (request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup") {
      if (await convexAuth.isAuthenticated()) {
        // We'll determine the correct dashboard in the signin page
        // For now, just allow access and let the page handle redirect
        return;
      }
    }
    return;
  }

  // Check if user is authenticated for protected routes
  if (!(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }

  // Allow authenticated users to access their dashboards
  // Role-based access control will be handled at the page/layout level
  return;
}, {
  apiRoute: "/api/auth",
  verbose: false // Set to true for debugging
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp).*)",
  ],
};