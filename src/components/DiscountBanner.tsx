"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { X, Copy, Check, Sparkles, Flame, Tag } from "lucide-react";

export interface DiscountBannerData {
  id: string;
  code: string;
  title?: string;
  bannerText: string;
  bannerTheme: "dark" | "amber" | "emerald" | "crimson";
  type: "percentage" | "fixed_cart" | string;
  amount: number;
  minCartTotal?: number;
  endsAt?: string | null;
}

const THEME_STYLES: Record<
  "dark" | "amber" | "emerald" | "crimson",
  {
    container: string;
    badge: string;
    button: string;
    border: string;
    glow: string;
  }
> = {
  dark: {
    container: "bg-slate-950 text-slate-100",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    button: "bg-white/10 hover:bg-white/20 text-white border-white/20",
    border: "border-slate-800/80",
    glow: "bg-orange-500/10",
  },
  amber: {
    container: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white",
    badge: "bg-black/20 text-amber-100 border-white/30",
    button: "bg-black/20 hover:bg-black/30 text-white border-white/30",
    border: "border-amber-500/60",
    glow: "bg-amber-400/20",
  },
  emerald: {
    container: "bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-emerald-100",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    button: "bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-400/30",
    border: "border-emerald-700/50",
    glow: "bg-emerald-500/10",
  },
  crimson: {
    container: "bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-rose-100",
    badge: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    button: "bg-rose-500/20 hover:bg-rose-500/30 text-white border-rose-400/30",
    border: "border-rose-700/50",
    glow: "bg-rose-500/10",
  },
};

const DISMISS_KEY = "myeyes_discount_banner_dismissed";

function DiscountBannerComponent() {
  const [banner, setBanner] = useState<DiscountBannerData | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveDiscountBanner() {
      try {
        const res = await fetch("/api/announcements/banner", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!data?.banner || !isMounted) return;

        // Check if user dismissed this specific discount during current session
        const dismissedId = sessionStorage.getItem(DISMISS_KEY);
        if (dismissedId === data.banner.id) return;

        setBanner(data.banner);
        // Small delay to trigger smooth CSS slide/fade-in
        requestAnimationFrame(() => setVisible(true));
      } catch {
        // Non-blocking fallback
      }
    }

    loadActiveDiscountBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (banner) {
      try {
        sessionStorage.setItem(DISMISS_KEY, banner.id);
      } catch {
        // sessionStorage might fail in strict private mode
      }
    }
    setVisible(false);
    setTimeout(() => setBanner(null), 300);
  }, [banner]);

  const handleCopyCode = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!banner?.code) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(banner.code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = banner.code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  }, [banner?.code]);

  if (!banner) return null;

  const currentTheme = THEME_STYLES[banner.bannerTheme] || THEME_STYLES.dark;
  const discountHighlight =
    banner.type === "percentage"
      ? `${banner.amount}% OFF`
      : `Rs. ${banner.amount.toLocaleString()} OFF`;

  // Content block that repeats in the ticker track
  const TickerItem = ({ index }: { index: number }) => (
    <div className="flex items-center gap-4 sm:gap-6 px-4 py-1 shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
        <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-300">
          LIMITED TIME OFFER
        </span>
      </div>

      <div className="h-3 w-px bg-white/20" />

      <span className="text-[12px] sm:text-[13px] font-medium tracking-tight whitespace-nowrap">
        {banner.bannerText}
      </span>

      <div className="h-3 w-px bg-white/20" />

      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-white/20 bg-black/20 text-white whitespace-nowrap shadow-xs">
        <Tag className="w-3 h-3 text-orange-400 shrink-0" />
        <span>CODE: {banner.code}</span>
        <span className="text-orange-400 font-extrabold ml-0.5">({discountHighlight})</span>
      </div>

      <div className="h-3 w-px bg-white/20" />

      <div className="flex items-center gap-1.5 text-[11px] opacity-85 whitespace-nowrap hidden md:inline-flex">
        <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
        <span>Live 3D Virtual Try-On • Free Delivery Across Pakistan</span>
      </div>

      <span className="text-white/40 text-[10px] mx-1">★</span>
    </div>
  );

  return (
    <aside
      id="site-discount-banner"
      aria-label="Active Promotional Discount"
      className={`
        relative w-full border-b text-xs overflow-hidden z-40 transition-all duration-300 ease-out
        ${currentTheme.container} ${currentTheme.border}
        ${visible ? "max-h-16 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 py-0 border-0 pointer-events-none"}
      `}
    >
      <div className="relative w-full flex items-center justify-between min-h-[38px] sm:min-h-[42px] px-2 sm:px-4">
        
        {/* Continuous Horizontal Marquee Container */}
        <div 
          className="flex-1 overflow-hidden relative cursor-default"
          title="Active Store Promotion (Hover to pause)"
        >
          {/* Subtle Left & Right edge gradient fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-inherit to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-inherit to-transparent z-10 pointer-events-none" />

          {/* Marquee Ticker Track */}
          <div className="animate-marquee flex items-center will-change-transform">
            {/* Duplicated items to make seamless 360-degree looping */}
            <TickerItem index={1} />
            <TickerItem index={2} />
            <TickerItem index={3} />
            <TickerItem index={4} />
          </div>
        </div>

        {/* Right Floating Quick-Actions: Copy Coupon & Dismiss */}
        <div className="flex items-center gap-2 pl-3 sm:pl-4 shrink-0 z-20">
          <button
            onClick={handleCopyCode}
            type="button"
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide
              transition-all duration-150 cursor-pointer border shadow-xs active:scale-95
              ${currentTheme.button}
            `}
            aria-label={`Copy discount code ${banner.code}`}
            title={`Copy code ${banner.code} to clipboard`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="hidden xs:inline">COPY</span>
                <span className="font-mono">{banner.code}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            type="button"
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss discount banner for this session"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
}

export const DiscountBanner = memo(DiscountBannerComponent);
export default DiscountBanner;
