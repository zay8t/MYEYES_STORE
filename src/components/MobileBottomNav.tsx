"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sun, Tag, Sparkles, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
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
  {
    label: "Cart",
    href: "#cart",
    icon: ShoppingBag,
    isCart: true,
    match: () => false,
  },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hidden on admin pages, quiz fullscreen, and checkout
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/checkout")) return null;

  const cartCount = mounted ? totalItems() : 0;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white/95 backdrop-blur-md border-t border-slate-200/80",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.04)]",
        "py-1.5 px-2 flex items-center justify-around",
        "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
        "will-change-transform transform-gpu"
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname ?? "");
        const Icon = item.icon;

        if (item.isCart) {
          return (
            <button
              key="cart"
              id="bottom-nav-cart"
              onClick={openCart}
              aria-label="Open Shopping Bag"
              className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] py-1 text-[10px] font-medium transition-colors cursor-pointer text-slate-500 hover:text-slate-800 active:scale-90"
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-5 h-5 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span
                    aria-label={`${cartCount} items in cart`}
                    className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#ff7a00] text-white text-[8px] font-black leading-none shadow-xs ring-1 ring-white animate-bounce-in"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight">Cart</span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[50px] py-1 text-[10px] transition-colors cursor-pointer active:scale-90",
              isActive
                ? "text-[#ff7a00] font-semibold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            )}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={cn("w-5 h-5 transition-colors", isActive ? "stroke-[2.2]" : "stroke-[1.8]")}
              />
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff7a00]"
                />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[62px]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
