import type { Metadata } from "next";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "Customer Directory | MY EYES Admin",
  description: "Unified customer account directory, contact details, order history, and role management.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminCustomersPage() {
  return <AdminUsersClient />;
}
