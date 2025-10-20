/**
 * Convex Utility Functions
 */

/**
 * Get the site URL without trailing slash
 * Prevents double slashes in constructed URLs
 */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL || "http://localhost:3000"
  // Remove trailing slash if present
  return url.endsWith("/") ? url.slice(0, -1) : url
}
