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
import NavigationSidebar from "@/components/NavigationSidebar";
import { cn } from "@/lib/utils";
import ShareAppButton from "@/components/ShareAppButton";
import { useAuth } from "@/components/AuthProvider";
import PDMeasurementModal from "@/components/PDTool/PDMeasurementModal";
import dynamic from "next/dynamic";

const ARTryOnModal = dynamic(() => import("@/components/ARTryOn/ARTryOnModal"), {
  ssr: false,
  loading: () => null,
});

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openWishlist, refreshTrigger } = useWishlistStore();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [guestWishlistCount, setGuestWishlistCount] = useState(0);
  const [pdModalOpen, setPdModalOpen] = useState(false);
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);

  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
  const openAccountDrawer = useAccountDrawerStore((s) => s.openAccountDrawer);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Secret triple-tap admin access
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
    setSidebarOpen(false);
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
          "sticky top-0 left-0 right-0 z-40 transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-2xs"
            : "bg-white/95 backdrop-blur-md border-b border-slate-100/80"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: 3-Bar Hamburger Menu + Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                id="header-hamburger-menu-btn"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-center active:scale-95"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <Link
                href="/"
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 group relative z-10 cursor-pointer select-none active:scale-95 transition-transform"
                aria-label="My Eyes — Home"
              >
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
                  <span className="text-base font-extrabold tracking-wider text-[#ff7a00] uppercase group-hover:text-amber-600 transition-colors duration-200">
                    MY EYES
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
                    OPTICAL STUDIO
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Quick Actions Cluster */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Search Trigger */}
              <button
                id="header-search-btn"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center"
                aria-label="Search Frames"
              >
                <Search className="w-4.5 h-4.5 stroke-[1.8]" />
              </button>

              {/* Wishlist Button (Opens Saved Frames Drawer) */}
              <button
                id="header-wishlist-btn"
                onClick={openWishlist}
                className="p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center"
                aria-label="Saved Frames Wishlist"
              >
                <Heart className="w-4.5 h-4.5 stroke-[1.8]" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-bounce-in">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                id="cart-button"
                onClick={openCart}
                className="p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4.5 h-4.5 stroke-[1.8]" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff7a00] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-bounce-in">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Share Button */}
              <ShareAppButton variant="icon" />

              {/* Auth State */}
              {mounted && !isLoading && (
                <>
                  {/* Guest → Sign In Pill (Desktop) & Icon Button (Mobile) */}
                  {!user && (
                    <>
                      <Link
                        href="/login"
                        id="header-signin-btn"
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full hover:border-slate-300 transition shadow-2xs"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Sign In
                      </Link>
                      <button
                        type="button"
                        onClick={openAccountDrawer}
                        className="sm:hidden p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition duration-150 relative cursor-pointer active:scale-95 flex items-center justify-center"
                        aria-label="Account"
                      >
                        <User className="w-5 h-5 stroke-[1.8]" />
                      </button>
                    </>
                  )}

                  {/* Authenticated → Minimalist Avatar Pill + Dropdown (Desktop) & Interactive Avatar (Mobile) */}
                  {user && (
                    <>
                      {/* Mobile Touch Avatar */}
                      <button
                        type="button"
                        onClick={openAccountDrawer}
                        className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] text-white text-[11px] font-extrabold flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer shrink-0"
                        aria-label="Open Mobile Account Menu"
                      >
                        {initials || <User className="w-4 h-4" />}
                      </button>

                      {/* Desktop Dropdown */}
                      <div className="relative hidden sm:block" ref={userDropdownRef}>
                        <button
                          id="header-user-menu"
                          onClick={() => setUserDropdownOpen((v) => !v)}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition shadow-2xs cursor-pointer select-none"
                        >
                          {/* Avatar initials */}
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
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

                        {/* Minified User Dropdown Container */}
                        {userDropdownOpen && (
                          <div className="absolute top-full right-0 mt-2 w-60 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-2">
                              {/* Customer Info */}
                              <div className="px-1 py-0.5">
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {user.email}
                                </p>
                              </div>

                              {/* Admin Shortcut (if admin) */}
                              {isAdmin && (
                                <>
                                  <div className="border-t border-slate-100 my-1.5" />
                                  <Link
                                    href="/admin"
                                    onClick={() => setUserDropdownOpen(false)}
                                    className="text-xs font-bold text-[#ff7a00] hover:bg-orange-50 rounded-xl p-2 w-full flex items-center gap-2 transition-colors"
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                    Admin Dashboard
                                  </Link>
                                </>
                              )}

                              {/* Subtle Separator Line */}
                              <div className="border-t border-slate-100 my-2" />

                              {/* Action Button: Sign Out */}
                              <button
                                id="header-signout-btn"
                                onClick={() => {
                                  setUserDropdownOpen(false);
                                  logout();
                                  }}
                                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl p-2 w-full flex items-center gap-2 transition-colors cursor-pointer text-left"
                              >
                                <LogOut className="w-3.5 h-3.5 shrink-0" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Search Drawer */}
          {searchOpen && (
            <div className="py-2.5 pb-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search frames, shapes, materials, styles..."
                  className="w-full pl-10 pr-20 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-all"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Slide-Out Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <MobileAccountDrawer />
      <NavigationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPDModal={() => setPdModalOpen(true)}
        onOpenTryOnModal={() => setTryOnModalOpen(true)}
      />

      {/* PD Measurement Studio */}
      <PDMeasurementModal
        isOpen={pdModalOpen}
        onClose={() => setPdModalOpen(false)}
        onConfirm={() => setPdModalOpen(false)}
      />

      {/* Virtual 3D Try-On */}
      <ARTryOnModal
        isOpen={tryOnModalOpen}
        onClose={() => setTryOnModalOpen(false)}
      />
    </>
  );
}
