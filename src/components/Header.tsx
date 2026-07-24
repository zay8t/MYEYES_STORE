"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Home, Tag, Glasses, Sun } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "@/components/CartDrawer";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/eyeglasses", label: "Eyeglasses", icon: Glasses },
  { href: "/sunglasses", label: "Sunglasses", icon: Sun },
  { href: "/pricing", label: "Lens Pricing", icon: Tag },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 bg-white transition-all duration-200",
          scrolled ? "border-b border-slate-200/80 shadow-xs" : "border-b border-slate-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="My Eyes Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider text-brand uppercase group-hover:text-brand-dark transition-colors">
                  MY EYES
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-450 font-semibold -mt-1">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "text-sm font-semibold tracking-wide transition-colors duration-150 flex items-center gap-1.5 py-1 px-2.5 rounded-lg",
                      isActive
                        ? "text-brand bg-brand/5"
                        : "text-slate-650 hover:text-brand hover:bg-brand/5"
                    )}
                  >
                    <IconComponent className={cn("w-4 h-4", isActive ? "text-brand" : "text-slate-400")} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                id="cart-button"
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-slate-900 text-white rounded-full">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "text-slate-900 bg-slate-100 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <IconComponent className={cn("w-4 h-4", isActive ? "text-slate-900" : "text-slate-400")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Slide-Out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
