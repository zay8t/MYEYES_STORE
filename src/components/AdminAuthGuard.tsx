"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * AdminAuthGuard — client-side RBAC verification and loading gate.
 * - SUPER_ADMIN: Unrestricted access to all admin sections.
 * - STORE_ADMIN / ADMIN / OPTICIAN: Restricted strictly to /admin/orders and /admin/payments.
 */
export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isRestrictedAdmin =
    role === "ADMIN" || role === "STORE_ADMIN" || role === "OPTICIAN";
  const hasAdminAccess = isSuperAdmin || isRestrictedAdmin;

  useEffect(() => {
    if (isLoading) return;

    if (!hasAdminAccess) {
      // Not authorized at all — redirect to home
      router.replace("/");
      return;
    }

    // If restricted admin tries to access a non-orders/non-payments route, redirect to /admin/orders
    if (isRestrictedAdmin) {
      const isOrdersPath = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
      const isPaymentsPath = pathname === "/admin/payments" || pathname.startsWith("/admin/payments/");

      if (!isOrdersPath && !isPaymentsPath) {
        router.replace("/admin/orders");
      }
    }
  }, [isLoading, hasAdminAccess, isRestrictedAdmin, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verifying Access...
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 shadow-xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Access Denied</h1>
            <p className="text-xs text-slate-500 mt-1">
              You need admin privileges to access this area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If restricted admin on restricted page, show loader until redirect occurs
  if (isRestrictedAdmin) {
    const isOrdersPath = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
    const isPaymentsPath = pathname === "/admin/payments" || pathname.startsWith("/admin/payments/");
    if (!isOrdersPath && !isPaymentsPath) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
