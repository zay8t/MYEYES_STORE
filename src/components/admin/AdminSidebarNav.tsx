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
  Calculator,
  Eye,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Executive Dashboard", label: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Prescription Pipeline", label: "Prescription Pipeline", href: "/admin/orders", icon: ShoppingBag },
  { name: "Payment Verification", label: "Payment Verification", href: "/admin/payments", icon: CreditCard, badge: "Pending" },
  { name: "Frames Catalog", label: "Frames Catalog", href: "/admin/products", icon: Glasses },
  { name: "Inventory Control", label: "Inventory Control", href: "/admin/inventory", icon: Boxes },
  { name: "Customer CRM", label: "Customer CRM", href: "/admin/customers", icon: Users },
  { name: "Users & Customers", label: "Users & Customers", href: "/admin/users", icon: Users },
  { name: "Partial Leads", label: "Partial Leads", href: "/admin/leads", icon: ClipboardList },
  { name: "Lens Pricing", label: "Lens Pricing", href: "/admin/lens-pricing", icon: Tag },
  { name: "Base Price Matrix ($B)", label: "Base Price Matrix ($B)", href: "/admin/base-prices", icon: Calculator },
  { name: "Presbyopia (+40) Pricing", label: "Presbyopia (+40) Pricing", href: "/admin/presbyopia-pricing", icon: Eye },
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
    <nav className="space-y-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const isPayment = item.href === "/admin/payments";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all group cursor-pointer",
              isActive
                ? "bg-amber-500/15 text-slate-950 font-extrabold border-l-4 border-amber-500 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-amber-600 font-bold" : "text-slate-400")} />
              <span>{item.label || item.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isPayment && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs animate-pulse">
                  {pendingCount > 0 ? `${pendingCount} Pending` : "Pending"}
                </span>
              )}
              <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-0.5", isActive ? "text-amber-600 opacity-100" : "text-slate-300 opacity-60")} />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
