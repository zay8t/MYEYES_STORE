"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Home,
  Tag,
  Glasses,
  Sun,
  ChevronDown,
  Sparkles,
  Search,
  X,
  Heart,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import { cn } from "@/lib/utils";
import ShareAppButton from "@/components/ShareAppButton";
import { useAuth } from "@/components/AuthProvider";

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
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openWishlist, refreshTrigger } = useWishlistStore();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    "eyeglasses" | "sunglasses" | "collections" | null
  >(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [guestWishlistCount, setGuestWishlistCount] = useState(0);

  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);
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
    setActiveDropdown(null);
    setUserDropdownOpen(false);
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
          "sticky top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-white border-b border-slate-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px] md:h-[72px]">
            {/* Brand Logo & Title */}
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
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      activeDropdown === "eyeglasses" && "rotate-180"
                    )}
                  />
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
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      activeDropdown === "sunglasses" && "rotate-180"
                    )}
                  />
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
                    pathname.startsWith("/men") ||
                      pathname.startsWith("/women") ||
                      pathname.startsWith("/kids")
                      ? "text-amber-600 bg-amber-50 font-bold"
                      : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                  )}
                >
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>Collections</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      activeDropdown === "collections" && "rotate-180"
                    )}
                  />
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
                href="/lens-pricing"
                className={cn(
                  "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 py-2 px-4 rounded-xl",
                  pathname.startsWith("/lens-pricing") || pathname === "/pricing"
                    ? "text-amber-600 bg-amber-50 font-bold"
                    : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                )}
              >
                <Tag className="w-4 h-4 text-slate-400" />
                Lens Pricing
              </Link>

              {/* Style Quiz Link */}
              <Link
                href="/quiz"
                id="nav-style-quiz-link"
                className={cn(
                  "text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 py-2 px-4 rounded-xl",
                  pathname.startsWith("/quiz")
                    ? "text-[#F59E0B] bg-amber-50/50 font-bold"
                    : "text-slate-600 hover:text-[#F59E0B] hover:bg-slate-50"
                )}
              >
                <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
                Style Quiz
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search Trigger */}
              <button
                id="header-search-btn"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center"
                aria-label="Search Frames"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Wishlist Button (Opens Saved Frames Drawer) */}
              <button
                id="header-wishlist-btn"
                onClick={openWishlist}
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Saved Frames Wishlist"
              >
                <Heart className="w-5 h-5 stroke-[1.8]" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full shadow-xs animate-bounce-in">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                id="cart-button"
                onClick={openCart}
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-[#ff7a00] text-white rounded-full shadow-xs animate-bounce-in">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Desktop Share Button */}
              <div className="hidden sm:block">
                <ShareAppButton variant="icon" />
              </div>

              {/* Auth State */}
              {mounted && !isLoading && (
                <>
                  {/* Guest → Sign In Pill */}
                  {!user && (
                    <Link
                      href="/login"
                      id="header-signin-btn"
                      className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-[#ff7a00] hover:text-[#ff7a00] transition-all shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" />
                      Sign In
                    </Link>
                  )}

                  {/* Authenticated → Minimalist Avatar Pill + Dropdown */}
                  {user && (
                    <div className="relative hidden sm:block" ref={userDropdownRef}>
                      <button
                        id="header-user-menu"
                        onClick={() => setUserDropdownOpen((v) => !v)}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:border-[#ff7a00]/50 transition-all shadow-xs cursor-pointer select-none"
                      >
                        {/* Avatar initials */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
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
    </>
  );
}
