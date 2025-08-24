import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simply pass through all requests - authentication is handled at the component level
export function middleware(_request: NextRequest) {
  // For now, just pass through all requests
  // Auth is handled by Convex Auth at the component level
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};