import React from "react";
import Link from "next/link";
import Image from "next/image";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { Sparkles, ExternalLink } from "lucide-react";

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
      <div className="min-h-screen bg-slate-50/60 flex flex-col">
        {/* Full-width sticky top navigation */}
        <AdminHeader />

        <div className="flex-1 flex relative">
          {/* Desktop Sidebar (Fixed Left - Sits below top-16 header) */}
          <aside className="hidden lg:flex flex-col w-64 bg-white text-slate-900 fixed top-16 bottom-0 left-0 z-30 border-r border-slate-200/80 shadow-2xs">
            {/* Brand Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 select-none overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative">
                <Image
                  src="/images/logo.png"
                  alt="MY EYES"
                  fill
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-wide">MY EYES</span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">ADMIN</span>
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
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full overflow-x-hidden min-h-[calc(100vh-64px)]">
            {/* Main Page Slot */}
            <main className="flex-1 w-full p-6 md:p-8 space-y-6 pt-6 max-w-7xl mx-auto min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
