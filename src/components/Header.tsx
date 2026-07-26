"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Menu, X, Home, Tag, Glasses, Sun, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "@/components/CartDrawer";
import { cn } from "@/lib/utils";

const EYEGLASSES_DROPDOWN = [
  { label: "All Eyeglasses", href: "/eyeglasses" },
  { label: "Men's Eyeglasses", href: "/eyeglasses?gender=Men" },
  { label: "Women's Eyeglasses", href: "/eyeglasses?gender=Women" },
  { label: "Kids' Eyeglasses", href: "/eyeglasses?gender=Kids" },
];

const SUNGLASSES_DROPDOWN = [
  { label: "All Sunglasses", href: "/sunglasses" },
  { label: "Men's Sunglasses", href: "/sunglasses?gender=Men" },
  { label: "Women's Sunglasses", href: "/sunglasses?gender=Women" },
  { label: "Kids' Sunglasses", href: "/sunglasses?gender=Kids" },
];

const COLLECTIONS_DROPDOWN = [
  { label: "Men's Collection", href: "/men" },
  { label: "Women's Collection", href: "/women" },
  { label: "Kids' Collection", href: "/kids" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"eyeglasses" | "sunglasses" | "collections" | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<"eyeglasses" | "sunglasses" | "collections" | null>(null);

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

  // Close mobile menu & dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
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
                <span className="text-base font-extrabold tracking-wider text-amber-600 uppercase group-hover:text-amber-700 transition-colors duration-200">
                  MY EYES
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={cn(
                  "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 py-2 px-4 rounded-xl",
                  pathname === "/"
                    ? "text-amber-600 bg-amber-50 font-bold"
                    : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                )}
              >
                <Home className="w-4 h-4 text-slate-400" />
                Home
              </Link>

              {/* Eyeglasses Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("eyeglasses")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/eyeglasses"
                  className={cn(
                    "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 py-2 px-4 rounded-xl",
                    pathname.startsWith("/eyeglasses")
                      ? "text-amber-600 bg-amber-50 font-bold"
                      : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                  )}
                >
                  <Glasses className="w-4 h-4 text-slate-400" />
                  <span>Eyeglasses</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", activeDropdown === "eyeglasses" && "rotate-180")} />
                </Link>

                {activeDropdown === "eyeglasses" && (
                  <div className="absolute top-full left-0 w-52 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-1">
                      {EYEGLASSES_DROPDOWN.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sunglasses Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("sunglasses")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/sunglasses"
                  className={cn(
                    "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 py-2 px-4 rounded-xl",
                    pathname.startsWith("/sunglasses")
                      ? "text-amber-600 bg-amber-50 font-bold"
                      : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                  )}
                >
                  <Sun className="w-4 h-4 text-slate-400" />
                  <span>Sunglasses</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", activeDropdown === "sunglasses" && "rotate-180")} />
                </Link>

                {activeDropdown === "sunglasses" && (
                  <div className="absolute top-full left-0 w-52 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-1">
                      {SUNGLASSES_DROPDOWN.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Collections Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("collections")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div
                  className={cn(
                    "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 py-2 px-4 rounded-xl cursor-pointer select-none",
                    pathname.startsWith("/men") || pathname.startsWith("/women") || pathname.startsWith("/kids")
                      ? "text-amber-600 bg-amber-50 font-bold"
                      : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                  )}
                >
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>Collections</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", activeDropdown === "collections" && "rotate-180")} />
                </div>

                {activeDropdown === "collections" && (
                  <div className="absolute top-full left-0 w-52 pt-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-1">
                      {COLLECTIONS_DROPDOWN.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lens Pricing */}
              <Link
                href="/pricing"
                className={cn(
                  "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 py-2 px-4 rounded-xl",
                  pathname === "/pricing"
                    ? "text-amber-600 bg-amber-50 font-bold"
                    : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                )}
              >
                <Tag className="w-4 h-4 text-slate-400" />
                Lens Pricing
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                id="cart-button"
                onClick={openCart}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200 cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-amber-500 text-slate-950 rounded-full shadow-sm animate-fade-in-up">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all duration-200 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
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

        {/* Mobile Nav Drawer — Accordion Category Support */}
        <div
          ref={mobileMenuRef}
          className={cn(
            "md:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300 ease-in-out",
            mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-0"
          )}
        >
          <div className="px-4 py-4 space-y-1.5">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 min-h-[44px]"
            >
              <Home className="w-4 h-4 text-slate-400" />
              Home
            </Link>

            {/* Mobile Eyeglasses Accordion */}
            <div>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "eyeglasses" ? null : "eyeglasses")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Glasses className="w-4 h-4 text-slate-400" />
                  <span>Eyeglasses</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mobileExpanded === "eyeglasses" && "rotate-180")} />
              </button>

              {mobileExpanded === "eyeglasses" && (
                <div className="pl-11 pr-4 py-1 space-y-1 bg-slate-50/60 rounded-xl my-1">
                  {EYEGLASSES_DROPDOWN.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-xs font-bold text-slate-700 hover:text-amber-600"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Sunglasses Accordion */}
            <div>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "sunglasses" ? null : "sunglasses")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-slate-400" />
                  <span>Sunglasses</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mobileExpanded === "sunglasses" && "rotate-180")} />
              </button>

              {mobileExpanded === "sunglasses" && (
                <div className="pl-11 pr-4 py-1 space-y-1 bg-slate-50/60 rounded-xl my-1">
                  {SUNGLASSES_DROPDOWN.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-xs font-bold text-slate-700 hover:text-amber-600"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Collections Accordion */}
            <div>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === "collections" ? null : "collections")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>Collections</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mobileExpanded === "collections" && "rotate-180")} />
              </button>

              {mobileExpanded === "collections" && (
                <div className="pl-11 pr-4 py-1 space-y-1 bg-slate-50/60 rounded-xl my-1">
                  {COLLECTIONS_DROPDOWN.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-xs font-bold text-slate-700 hover:text-amber-600"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Lens Pricing */}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 min-h-[44px]"
            >
              <Tag className="w-4 h-4 text-slate-400" />
              Lens Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-Out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
