"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  Shield,
  ChevronDown,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAccountDrawerStore } from "@/store/useAccountDrawerStore";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import MobileAccountDrawer from "@/components/customer/MobileAccountDrawer";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { cn } from "@/lib/utils";
import ShareAppButton from "@/components/ShareAppButton";
import { useAuth } from "@/components/AuthProvider";
import PDMeasurementModal from "@/components/PDTool/PDMeasurementModal";


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openWishlist, refreshTrigger } = useWishlistStore();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [guestWishlistCount, setGuestWishlistCount] = useState(0);
  const [pdModalOpen, setPdModalOpen] = useState(false);

  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const openAccountDrawer = useAccountDrawerStore((s) => s.openAccountDrawer);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Secret triple-tap admin access on logo
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 800) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 3) {
      e.preventDefault();
      e.stopPropagation();
      tapCountRef.current = 0;
      router.push("/admin");
      return;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update guest wishlist count from localStorage
  useEffect(() => {
    if (!user && mounted) {
      try {
        const stored = localStorage.getItem("myeyes_guest_wishlist");
        const productIds: string[] = stored ? JSON.parse(stored) : [];
        setGuestWishlistCount(productIds.length);
      } catch {
        setGuestWishlistCount(0);
      }
    }
  }, [user, mounted, refreshTrigger]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close search & dropdowns on route change
  useEffect(() => {
    setSearchOpen(false);
    setUserDropdownOpen(false);
    setIsSidebarOpen(false);
  }, [pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/eyeglasses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/quiz")) return null;

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const firstName = user?.name?.split(" ")[0] || "";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const wishlistCount = user ? user.wishlistCount : guestWishlistCount;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-40 w-full transition-all duration-200",
          scrolled
            ? "bg-white border-b border-neutral-200 shadow-sm"
            : "bg-white border-b border-neutral-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-2">

          {/* Left: Hamburger (desktop/sm+ only) + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            {/* Hamburger — hidden on mobile, visible sm+ */}
            <button
              type="button"
              id="header-hamburger-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              className="hidden sm:flex p-2 -ml-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition cursor-pointer items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 select-none group active:scale-95 transition-transform"
              aria-label="My Eyes — Home"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.svg"
                  alt="My Eyes Logo"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center shrink-0">
                <span className="text-xs sm:text-base font-extrabold tracking-tight text-[#ff7a00] leading-tight group-hover:text-amber-600 transition-colors">
                  MY EYES
                </span>
                <span className="text-[8px] sm:text-[10px] font-semibold tracking-widest text-slate-400 leading-none uppercase">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Core action icons — Search, Wishlist, Bag (always visible) + desktop-only extras */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">

            {/* Search */}
            <button
              id="header-search-btn"
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition duration-150 relative cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist */}
            <button
              id="header-wishlist-btn"
              type="button"
              onClick={openWishlist}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition duration-150 relative cursor-pointer"
              aria-label="Saved Items"
            >
              <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ff7a00] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Bag / Cart */}
            <button
              id="cart-button"
              type="button"
              onClick={openCart}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition duration-150 relative cursor-pointer"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {mounted && totalItems() > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ff7a00] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Share App Button — desktop only */}
            <div className="hidden sm:flex items-center">
              <ShareAppButton variant="icon" />
            </div>

            {/* Auth — desktop only (mobile uses bottom nav & account drawer) */}
            {mounted && !isLoading && (
              <>
                {/* Guest → Sign In (desktop only) */}
                {!user && (
                  <Link
                    href="/login"
                    id="header-signin-btn"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full hover:border-slate-300 transition shadow-sm"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sign In</span>
                  </Link>
                )}

                {/* Authenticated → Profile Dropdown (desktop only) */}
                {user && (
                  <div className="relative hidden sm:block" ref={userDropdownRef}>
                    <button
                      id="header-user-menu"
                      type="button"
                      onClick={() => setUserDropdownOpen((v) => !v)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition shadow-sm cursor-pointer select-none"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-[9px] font-extrabold shrink-0">
                        {initials}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{firstName}</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                          userDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-60 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-2">
                          <div className="px-1 py-0.5">
                            <p className="text-sm font-bold text-slate-900 leading-tight">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>

                          {isAdmin && (
                            <>
                              <div className="border-t border-slate-100 my-1.5" />
                              <Link
                                href="/admin"
                                onClick={() => setUserDropdownOpen(false)}
                                className="text-xs font-bold text-[#ff7a00] hover:bg-orange-50 rounded-xl p-2 w-full flex items-center gap-2 transition-colors"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </>
                          )}

                          <div className="border-t border-slate-100 my-2" />

                          <button
                            id="header-signout-btn"
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl p-2 w-full flex items-center gap-2 transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Search Drawer */}
        {searchOpen && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 pb-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search frames, shapes, materials, styles..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-all"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Slide-Out Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <MobileAccountDrawer />

      {/* Slide-Out Navigation Sidebar (desktop) */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenPDModal={() => setPdModalOpen(true)}
      />

      {/* PD Measurement Studio Modal */}
      <PDMeasurementModal
        isOpen={pdModalOpen}
        onClose={() => setPdModalOpen(false)}
        onConfirm={() => setPdModalOpen(false)}
      />
    </>
  );
}

export { Header };
