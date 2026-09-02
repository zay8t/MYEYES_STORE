"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Glasses,
  Boxes,
  Users,
  ChevronRight,
  ClipboardList,
  Tag,
  Eye,
  CreditCard,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  showPendingBadge?: boolean;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
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

export default function AdminSidebarNav() {
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
    <nav className="space-y-5">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.title} className="space-y-1">
          <div className="px-3.5 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase select-none">
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
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer",
                    isActive
                      ? "bg-amber-500/15 text-slate-950 font-extrabold border-l-4 border-amber-500 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-transform group-hover:scale-110 shrink-0",
                        isActive ? "text-amber-600 font-bold" : "text-slate-400"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.showPendingBadge && pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5",
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
    </nav>
  );
}
