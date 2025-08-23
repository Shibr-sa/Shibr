import { 
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/signin",
  "/signup",
  "/",
  "/marketplace",
  "/api/convex/(.*)"
]);

const isAuthRoute = createRouteMatcher([
  "/signin",
  "/signup"
]);

const isAdminRoute = createRouteMatcher([
  "/admin-dashboard/(.*)"
]);

const isBrandRoute = createRouteMatcher([
  "/brand-dashboard/(.*)"
]);

const isStoreRoute = createRouteMatcher([
  "/store-dashboard/(.*)"
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  
  // Allow public routes
  if (isPublicRoute(request)) {
    return;
  }
  
  // Protect all dashboard routes
  if (!isAuthenticated) {
    if (isAdminRoute(request) || isBrandRoute(request) || isStoreRoute(request)) {
      return nextjsMiddlewareRedirect(request, "/signin");
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};