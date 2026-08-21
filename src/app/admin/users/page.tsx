import type { Metadata } from "next";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const metadata: Metadata = {
  title: "Users & Customers | MY EYES Admin",
  description: "Customer account management, prescription inspection, and role administration.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
