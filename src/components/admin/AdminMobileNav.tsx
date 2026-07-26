"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Glasses,
  Boxes,
  Users,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Prescription Pipeline", href: "/admin/orders", icon: ShoppingBag },
  { name: "Frames Catalog", href: "/admin/products", icon: Glasses },
  { name: "Inventory Control", href: "/admin/inventory", icon: Boxes },
  { name: "Customer CRM", href: "/admin/customers", icon: Users },
];

export default function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open mobile navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Sheet Drawer (Light Minimal) */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col border-r border-slate-200/80",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 p-1 flex items-center justify-center border border-amber-300/50">
              <Image
                src="/logo.png"
                alt="My Eyes Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 tracking-wide">MY EYES</h2>
              <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block">
                ADMIN SUITE
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all",
                  isActive
                    ? "bg-amber-500/15 text-slate-950 font-extrabold border-l-4 border-amber-500 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-amber-600" : "text-slate-400")} />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 opacity-70", isActive ? "text-amber-600" : "text-slate-300")} />
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200/80"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Visit Store Website
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="px-3.5 py-2 text-[10px] text-slate-400 font-mono text-center">
            My Eyes Retail Operating Suite v2.5
          </div>
        </div>
      </div>
    </>
  );
}
