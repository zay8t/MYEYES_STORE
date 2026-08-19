"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sparkles, ShoppingBag } from "lucide-react";
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
      p.startsWith("/sunglasses") ||
      p.startsWith("/collections") ||
      p.startsWith("/men") ||
      p.startsWith("/women") ||
      p.startsWith("/kids") ||
      p.startsWith("/products"),
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

  // Hidden on admin pages, quiz fullscreen, and checkout
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/quiz")) return null;
  if (pathname?.startsWith("/checkout")) return null;

  const cartCount = mounted ? totalItems() : 0;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-white/95 backdrop-blur-lg border-t border-gray-100",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.03)]",
        "pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-2 px-6",
        "will-change-transform transform-gpu"
      )}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match(pathname ?? "");
          const Icon = item.icon;

          if (item.isCart) {
            return (
              <button
                key="cart"
                id="bottom-nav-cart"
                onClick={openCart}
                aria-label="Open Cart"
                className="flex flex-col items-center justify-center gap-1 flex-1 text-center group cursor-pointer active:scale-90 transition-transform duration-150"
              >
                <div className="relative flex items-center justify-center w-10 h-7 rounded-xl transition-colors">
                  <Icon
                    className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors"
                    strokeWidth={1.8}
                  />
                  {cartCount > 0 && (
                    <span
                      aria-label={`${cartCount} items in cart`}
                      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full bg-[#ff7a00] text-white text-[9px] font-black leading-none shadow-sm ring-2 ring-white animate-bounce-in"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight text-slate-400 group-hover:text-slate-700 transition-colors">
                  Cart
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1 flex-1 text-center group cursor-pointer active:scale-90 transition-transform duration-150"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-7 rounded-xl transition-colors",
                  isActive ? "bg-[#ff7a00]/10" : "group-hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-[#ff7a00]" : "text-slate-400 group-hover:text-slate-600"
                  )}
                  strokeWidth={isActive ? 2.25 : 1.8}
                />
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff7a00]"
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-tight transition-colors",
                  isActive ? "text-[#ff7a00]" : "text-slate-400 group-hover:text-slate-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
