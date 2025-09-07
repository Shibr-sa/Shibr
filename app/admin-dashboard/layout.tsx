import { requireRole } from "@/lib/auth/server";
import AdminDashboardLayoutClient from "./layout-client";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not authenticated or wrong role
  await requireRole("admin");
  
  // If we get here, user is authenticated with correct role
  return <AdminDashboardLayoutClient>{children}</AdminDashboardLayoutClient>;
}