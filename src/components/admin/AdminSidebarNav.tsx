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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Prescription Pipeline", href: "/admin/orders", icon: ShoppingBag },
  { name: "Frames Catalog", href: "/admin/products", icon: Glasses },
  { name: "Inventory Control", href: "/admin/inventory", icon: Boxes },
  { name: "Customer CRM", href: "/admin/customers", icon: Users },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
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
            className={cn(
              "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all group cursor-pointer",
              isActive
                ? "bg-amber-500/15 text-slate-950 font-extrabold border-l-4 border-amber-500 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-amber-600 font-bold" : "text-slate-400")} />
              <span>{item.name}</span>
            </div>
            <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-0.5", isActive ? "text-amber-600 opacity-100" : "text-slate-300 opacity-60")} />
          </Link>
        );
      })}
    </nav>
  );
}
