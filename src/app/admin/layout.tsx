import React from "react";
import Link from "next/link";
import Image from "next/image";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import { Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Admin Portal | My Eyes Prescription Eyewear",
  description: "Enterprise Optical Retail & Prescription Order Management System",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50/60 flex">
        {/* Desktop Sidebar (Fixed Left - Minimal Light Aesthetic) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white text-slate-900 fixed inset-y-0 left-0 z-30 border-r border-slate-200/80 shadow-2xs">
          {/* Logo & Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 p-1.5 flex items-center justify-center border border-amber-300/50 shadow-2xs">
                <Image
                  src="/logo.png"
                  alt="My Eyes Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900">MY EYES</h1>
                <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-500" /> ADMIN SUITE
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <AdminSidebarNav />
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border border-slate-200/80 shadow-2xs group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                Live Customer Store
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <div className="px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[10px] text-slate-600 flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Lab Engine Active
              </span>
              <span className="font-mono text-amber-700">v2.5</span>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full overflow-x-hidden">
          {/* Top Sticky App Bar */}
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <AdminMobileNav />
              <div className="min-w-0">
                <span className="text-xs font-extrabold tracking-tight text-slate-900 block lg:hidden truncate">
                  MY EYES ADMIN
                </span>
                <span className="hidden lg:inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
                  PRESCRIPTION OPTICAL MANAGEMENT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-bold px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>SQLite DB Online</span>
              </div>

              <Link
                href="/"
                target="_blank"
                className="px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </header>

          {/* Main Page Slot */}
          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
