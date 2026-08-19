"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Glasses, Sparkles, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useIsStandalone } from "@/hooks/useIsStandalone";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (p: string) => p === "/",
  },
  {
    label: "Catalogue",
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
  const { isStandalone, mounted } = useIsStandalone();
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  // Don't render on admin pages or quiz (quiz has its own full-screen layout)
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/quiz")) return null;
  if (pathname?.startsWith("/checkout")) return null;

  // Only render in standalone/installed app mode
  if (!mounted || !isStandalone) return null;

  const cartCount = totalItems();

  return (
    <nav
      aria-label="App bottom navigation"
      className={cn(
        // Hardware-accelerated fixed bar with clean glassmorphism
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-white/95 backdrop-blur-xl",
        "border-t border-slate-100",
        "shadow-[0_-1px_0_0_rgba(0,0,0,0.04),0_-4px_24px_-4px_rgba(0,0,0,0.06)]",
        // Safe-area inset for iOS notch / Android gesture bar
        "pb-[max(env(safe-area-inset-bottom),0.75rem)]",
        // GPU-promote to its own compositing layer for 60fps
        "will-change-transform",
        "transform-gpu"
      )}
    >
      <div className="flex items-stretch justify-around px-2 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match(pathname ?? "");
          const Icon = item.icon;

          if (item.isCart) {
            return (
              <button
                key="cart"
                id="bottom-nav-cart"
                onClick={openCart}
                aria-label="Open shopping cart"
                className="flex flex-col items-center justify-center flex-1 gap-0.5 px-2 py-1.5 group"
              >
                <span className="relative">
                  <span
                    className={cn(
                      "flex items-center justify-center w-10 h-[28px] rounded-xl transition-all duration-200",
                      "group-active:scale-[0.88] group-active:transition-none"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[22px] h-[22px] transition-colors duration-200",
                        "text-slate-400 group-hover:text-slate-700"
                      )}
                      strokeWidth={1.75}
                    />
                  </span>
                  {cartCount > 0 && (
                    <span
                      aria-label={`${cartCount} items in cart`}
                      className={cn(
                        "absolute -top-1.5 -right-1.5",
                        "flex items-center justify-center",
                        "min-w-[16px] h-4 px-1 rounded-full",
                        "bg-[#ff7a00] text-white text-[9px] font-black leading-none",
                        "shadow-sm ring-2 ring-white",
                        "animate-bounce-in"
                      )}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-tight transition-colors duration-200",
                    "text-slate-400 group-hover:text-slate-700"
                  )}
                >
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
              className="flex flex-col items-center justify-center flex-1 gap-0.5 px-2 py-1.5 group"
            >
              {/* Active pill indicator */}
              <span className="relative flex items-center justify-center">
                <span
                  className={cn(
                    "flex items-center justify-center w-10 h-[28px] rounded-xl",
                    "transition-all duration-200 ease-out",
                    "group-active:scale-[0.88] group-active:transition-none",
                    isActive
                      ? "bg-[#ff7a00]/10"
                      : "group-hover:bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[22px] h-[22px] transition-colors duration-200",
                      isActive
                        ? "text-[#ff7a00]"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff7a00]"
                  />
                )}
              </span>

              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight transition-colors duration-200",
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
