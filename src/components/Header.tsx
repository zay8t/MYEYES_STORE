"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-white border-b border-slate-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Brand Logo & Title */}
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 group relative z-10">
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
                <span className="text-base font-extrabold tracking-wider text-brand uppercase group-hover:text-brand-dark transition-colors duration-200">
                  MY EYES
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "relative text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 py-2 px-4 rounded-xl",
                      isActive
                        ? "text-brand bg-brand/8"
                        : "text-slate-600 hover:text-brand hover:bg-brand/5"
                    )}
                  >
                    <IconComponent
                      className={cn(
                        "w-4 h-4 transition-colors duration-200",
                        isActive ? "text-brand" : "text-slate-400 group-hover:text-brand"
                      )}
                    />
                    {link.label}
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand animate-fade-in-up" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                id="cart-button"
                onClick={openCart}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200 cursor-pointer active:scale-95"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-brand text-white rounded-full shadow-sm animate-fade-in-up">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all duration-200 active:scale-95"
                aria-label="Toggle navigation menu"
              >
                <div className="relative w-5 h-5">
                  <Menu className={cn(
                    "w-5 h-5 absolute inset-0 transition-all duration-300",
                    mobileOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                  )} />
                  <X className={cn(
                    "w-5 h-5 absolute inset-0 transition-all duration-300",
                    mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                  )} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer — Animated */}
        <div
          ref={mobileMenuRef}
          className={cn(
            "md:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300 ease-in-out",
            mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                    isActive
                      ? "text-brand bg-brand/8 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-brand"
                  )}
                  style={{
                    transitionDelay: mobileOpen ? `${index * 50}ms` : "0ms",
                    transform: mobileOpen ? "translateX(0)" : "translateX(-12px)",
                    opacity: mobileOpen ? 1 : 0,
                  }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                    isActive ? "bg-brand/15 text-brand" : "bg-slate-100 text-slate-400"
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  {link.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Slide-Out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
