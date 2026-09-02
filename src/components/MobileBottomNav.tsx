"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sun, Sparkles, Calculator } from "lucide-react";
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
    label: "Style Quiz",
    href: "/quiz",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/quiz"),
  },
  {
    label: "Lens Prices",
    href: "/lens-pricing",
    icon: Calculator,
    match: (p: string) => p.startsWith("/lens-pricing") || p.startsWith("/pricing"),
  },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hidden on admin pages and checkout
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "bg-white/95 backdrop-blur-md border-t border-neutral-100",
        "shadow-[0_-2px_12px_rgba(0,0,0,0.06)]",
        "pt-1 px-1 grid grid-cols-5 items-start",
        "pb-[env(safe-area-inset-bottom,12px)]",
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
              "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] rounded-lg transition-colors active:scale-90 text-center",
              isActive
                ? "text-black"
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Icon
              className={cn(
                "w-[22px] h-[22px] transition-all",
                isActive ? "stroke-[2.2]" : "stroke-[1.6]"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight truncate max-w-[60px] leading-tight",
                isActive ? "font-medium" : "font-normal"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
