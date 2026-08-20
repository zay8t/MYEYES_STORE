"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sun, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (p: string) => p === "/",
  },
  {
    label: "Frames",
    href: "/eyeglasses",
    icon: Glasses,
    match: (p: string) =>
      p.startsWith("/eyeglasses") ||
      p.startsWith("/men") ||
      p.startsWith("/women") ||
      p.startsWith("/kids") ||
      p.startsWith("/products") ||
      p.startsWith("/collections") ||
      p.startsWith("/catalogue"),
  },
  {
    label: "Sunglasses",
    href: "/sunglasses",
    icon: Sun,
    match: (p: string) => p.startsWith("/sunglasses"),
  },
  {
    label: "Lens Pricing",
    href: "/lens-pricing",
    icon: Tag,
    match: (p: string) => p.startsWith("/lens-pricing") || p === "/pricing",
  },
  {
    label: "Style Quiz",
    href: "/quiz",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/quiz"),
  },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hidden on admin pages, quiz fullscreen, and checkout
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white/95 backdrop-blur-md border-t border-slate-200/80",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.04)]",
        "py-1.5 px-2 grid grid-cols-5 items-center",
        "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
        "will-change-transform transform-gpu"
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname ?? "");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors cursor-pointer active:scale-90 text-center",
              isActive
                ? "text-[#ff7a00] font-semibold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            )}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "stroke-[2.2]" : "stroke-[1.8]"
                )}
              />
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff7a00]"
                />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[64px]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
