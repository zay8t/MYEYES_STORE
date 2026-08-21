import type { Metadata } from "next";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "User Data | MY EYES Admin",
  description: "Customer account directory, contact details, and role management.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
