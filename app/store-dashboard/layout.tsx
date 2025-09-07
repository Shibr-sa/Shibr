import { requireRole } from "@/lib/auth/server";
import StoreDashboardLayoutClient from "./layout-client";

export default async function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated or wrong role
  await requireRole("store_owner");
  
  // If we get here, user is authenticated with correct role
  return <StoreDashboardLayoutClient>{children}</StoreDashboardLayoutClient>;
}