"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import AdminMobileNav from "./AdminMobileNav";

export default function AdminHeader() {
  const handleLogout = () => {
    sessionStorage.removeItem("my_eyes_admin_auth_v1");
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-slate-200/80 h-16 px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      {/* Far Left: Mobile Nav & Logo */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center">
          <AdminMobileNav />
        </div>
        <Link href="/admin" className="text-slate-900 font-bold text-base tracking-wide flex items-center gap-3 select-none">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 p-1.5 flex items-center justify-center border border-amber-300/40 shadow-3xs flex-shrink-0">
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

      {/* Center: System Status Badge */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 text-slate-600 text-xs px-3 py-1 rounded-full select-none">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold">System Online & Connected</span>
      </div>

      {/* Far Right: Logout Button */}
      <button
        onClick={handleLogout}
        className="text-slate-500 hover:text-slate-950 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-0 outline-none p-1 rounded-lg hover:bg-slate-50"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout Admin Session</span>
      </button>
    </header>
  );
}
