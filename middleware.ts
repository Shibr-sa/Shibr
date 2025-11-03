import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/signin",
  "/signup",
  "/signup/select-type",
  "/verify-email", // Email verification page
  "/marketplace",
  "/marketplace/(.*)", // Match all marketplace routes
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/contact",
  "/store/(.*)", // Public store pages for customer purchases
  "/api/auth", // Auth callback route
  "/api/auth/(.*)"
]);

// Define protected route patterns
const isAdminRoute = createRouteMatcher(["/admin-dashboard", "/admin-dashboard/(.*)"]);
const isStoreRoute = createRouteMatcher(["/store-dashboard", "/store-dashboard/(.*)"]);
const isBrandRoute = createRouteMatcher(["/brand-dashboard", "/brand-dashboard/(.*)"]);

// Security headers configuration
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy - adjust based on your needs
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.tap.company",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://api.tap.company https://maps.googleapis.com https://*.googleapis.com",
    "frame-src 'self' https://checkout.tap.company",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ")

  response.headers.set("Content-Security-Policy", cspHeader)

  // Additional security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    )
  }

  return response
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const pathname = request.nextUrl.pathname;

  // Allow public routes without any authentication check
  if (isPublicRoute(request)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Only check authentication for protected routes
  const isAuthenticated = await convexAuth.isAuthenticated();

  // Redirect unauthenticated users to signin for protected routes
  if (!isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }

  // Allow authenticated users to access all routes
  const response = NextResponse.next();
  return addSecurityHeaders(response);
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