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
  ClipboardList,
  Tag,
  Eye,
  CreditCard,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavCategory {
  title: string;
  items: {
    name: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    showPendingBadge?: boolean;
  }[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    title: "1. DASHBOARD",
    items: [
      { name: "Overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "2. ORDERS",
    items: [
      { name: "All Orders", label: "All Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Verify Deposits", label: "Verify Deposits", href: "/admin/payments", icon: CreditCard, showPendingBadge: true },
    ],
  },
  {
    title: "3. PRODUCTS & STOCK",
    items: [
      { name: "Frames Catalog", label: "Frames Catalog", href: "/admin/products", icon: Glasses },
      { name: "Stock Levels", label: "Stock Levels", href: "/admin/inventory", icon: Boxes },
    ],
  },
  {
    title: "4. CUSTOMERS & LEADS",
    items: [
      { name: "Customer Directory", label: "Customer Directory", href: "/admin/customers", icon: Users },
      { name: "Incomplete Leads", label: "Incomplete Leads", href: "/admin/leads", icon: ClipboardList },
    ],
  },
  {
    title: "5. PRICING & PROMOTIONS",
    items: [
      { name: "Lens Pricing", label: "Lens Pricing", href: "/admin/lens-pricing", icon: Tag },
      { name: "Presbyopia (+40) Pricing", label: "Presbyopia (+40) Pricing", href: "/admin/presbyopia-pricing", icon: Eye },
      { name: "Discounts & Offers", label: "Discounts & Offers", href: "/admin/discounts", icon: TicketPercent },
    ],
  },
];

export default function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = React.useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/admin/payments?paymentStatus=PENDING_VERIFICATION");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === "number") {
            setPendingCount(data.count);
          }
        }
      } catch {
        // silent
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        aria-label="Open mobile navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 md:top-0 z-[105] md:z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Sheet Drawer */}
      <div
        className={cn(
          "fixed bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-out flex flex-col lg:hidden",
          "inset-y-0 right-0 top-16 w-full max-w-sm h-[calc(100vh-64px)] z-[110] border-l border-slate-200/80",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 p-1 flex items-center justify-center border border-amber-300/50">
              <Image src="/logo.svg" alt="My Eyes" width={20} height={20} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block leading-none">MY EYES</span>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {NAV_CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase select-none">
                {category.title}
              </div>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                        isActive
                          ? "bg-amber-500/15 text-slate-950 font-extrabold border-l-4 border-amber-500 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-amber-600 font-bold" : "text-slate-400"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.showPendingBadge && pendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                            {pendingCount}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "w-3.5 h-3.5",
                            isActive ? "text-amber-600 opacity-100" : "text-slate-300 opacity-60"
                          )}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 transition-all border border-slate-200/80 shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Live Storefront
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-[10px] text-slate-700 flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Store Online • v2.5
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
