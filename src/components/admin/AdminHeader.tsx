"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import AdminMobileNav from "./AdminMobileNav";
import { useAuth } from "@/components/AuthProvider";
import PushNotificationToggle from "./PushNotificationToggle";

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const homeHref = user?.role === "SUPER_ADMIN" ? "/admin" : "/admin/orders";

  const handleLogout = async () => {
    sessionStorage.removeItem("my_eyes_admin_auth_v1");
    await logout();
  };

  return (
    <header className="bg-white border-b border-slate-200/80 h-16 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs gap-2">
      {/* Far Left: Mobile Nav & Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="lg:hidden flex items-center">
          <AdminMobileNav />
        </div>
        <Link href={homeHref} className="text-slate-900 font-bold text-base tracking-wide flex items-center gap-2 sm:gap-3 select-none">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 p-1.5 flex items-center justify-center border border-amber-300/40 shadow-3xs shrink-0">
            <Image
              src="/logo.svg"
              alt="My Eyes Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold tracking-tight">MY EYES</span>
          <span className="hidden sm:inline-block text-[10px] text-amber-600 font-extrabold uppercase tracking-widest bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/50">
            Admin
          </span>
        </Link>
      </div>

      {/* Right Controls: Status Badge (desktop-only), Push Toggle (all screens), Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop-only status pill */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>System Online & Connected</span>
        </div>

        {/* Push Notification Toggle (Visible across all viewports) */}
        <PushNotificationToggle />

        {/* Far Right: Logout Button */}
        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0 outline-none p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 shrink-0"
          title="Logout Admin Session"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
