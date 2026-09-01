"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Megaphone } from "lucide-react";

interface BannerData {
  id: string;
  code: string;
  bannerText: string;
  bannerTheme: "dark" | "amber" | "emerald" | "crimson";
  type: string;
  amount: number;
}

const THEME_CLASSES: Record<BannerData["bannerTheme"], string> = {
  dark: "bg-slate-900 text-white border-slate-700",
  amber: "bg-amber-500 text-white border-amber-400",
  emerald: "bg-emerald-600 text-white border-emerald-500",
  crimson: "bg-rose-600 text-white border-rose-500",
};

const DISMISS_KEY = "myeyes_banner_dismissed";

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/announcements/banner", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.banner) return;

        // Check if this banner was already dismissed in this session
        const dismissed = sessionStorage.getItem(DISMISS_KEY);
        if (dismissed === data.banner.id) return;

        setBanner(data.banner);
        setVisible(true);
      } catch {
        // Silent — banner is non-critical
      }
    };

    fetchBanner();
  }, []);

  const handleDismiss = useCallback(() => {
    if (banner) sessionStorage.setItem(DISMISS_KEY, banner.id);
    setVisible(false);
    setTimeout(() => setBanner(null), 300);
  }, [banner]);

  const handleCopy = useCallback(async () => {
    if (!banner) return;
    try {
      await navigator.clipboard.writeText(banner.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [banner]);

  if (!banner) return null;

  return (
    <div
      className={`
        relative w-full py-2.5 px-4 border-b text-xs font-semibold tracking-wide
        flex items-center justify-center gap-3 z-50 transition-all duration-300
        ${THEME_CLASSES[banner.bannerTheme]}
        ${visible ? "max-h-16 opacity-100" : "max-h-0 opacity-0 overflow-hidden py-0 border-0"}
      `}
      role="banner"
      aria-label="Promotional announcement"
    >
      {/* Icon */}
      <Megaphone className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />

      {/* Message */}
      <span className="text-center leading-snug">{banner.bannerText}</span>

      {/* Copy code pill */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border border-white/30 font-bold text-[10px] uppercase tracking-widest flex-shrink-0"
        aria-label={`Copy code ${banner.code}`}
        title={`Copy ${banner.code}`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            {banner.code}
          </>
        )}
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
