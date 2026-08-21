"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * AdminAuthGuard — replaces the old plaintext-password gate.
 * The middleware already blocks /admin/* for non-ADMIN users and redirects to /login.
 * This component provides a client-side double-check and loading state.
 */
export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // Not authorized — redirect to home
      router.replace("/");
    }
  }, [isLoading, isAdmin, router]);

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
  if (!isAdmin) {
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

  return <>{children}</>;
}
