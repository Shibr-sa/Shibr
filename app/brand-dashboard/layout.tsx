import { requireRole } from "@/lib/auth/server";
import BrandDashboardLayoutClient from "./layout-client";

export default async function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated or wrong role
  await requireRole("brand_owner");
  
  // If we get here, user is authenticated with correct role
  return <BrandDashboardLayoutClient>{children}</BrandDashboardLayoutClient>;
}