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
        w-full px-3 py-2 border-b text-xs transition-all duration-300 z-50
        ${THEME_CLASSES[banner.bannerTheme] || "bg-slate-950 text-white"}
        ${visible ? "max-h-24 opacity-100" : "max-h-0 opacity-0 overflow-hidden py-0 border-0"}
      `}
      role="banner"
      aria-label="Promotional announcement"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-90" />
          <span className="font-medium tracking-wide uppercase truncate text-[11px] sm:text-xs">
            {banner.bannerText}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[11px] font-semibold tracking-wider transition-colors cursor-pointer border border-white/20"
            aria-label={`Copy code ${banner.code}`}
            title={`Copy ${banner.code}`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{banner.code}</span>
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
