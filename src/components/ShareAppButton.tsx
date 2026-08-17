"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const SHARE_DATA = {
  title: "MyEyes Eyewear",
  text: "Shop premium prescription eyewear across Pakistan on MyEyes!",
  url: "https://www.myeyes.pk",
};

interface ShareAppButtonProps {
  /** "icon" = icon-only (header bar), "row" = full-width row (mobile drawer) */
  variant?: "icon" | "row";
  className?: string;
}

export default function ShareAppButton({
  variant = "icon",
  className,
}: ShareAppButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Native Web Share API — Android Chrome, iOS Safari 15+
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(SHARE_DATA);
        return;
      } catch (err) {
        // User cancelled the share sheet — not an error
        if ((err as DOMException).name === "AbortError") return;
      }
    }

    // Fallback: copy URL to clipboard with brief visual confirmation
    try {
      await navigator.clipboard.writeText(SHARE_DATA.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last-resort: prompt if clipboard API is also blocked
      window.prompt("Copy this link:", SHARE_DATA.url);
    }
  };

  // ── Icon-only variant (desktop/mobile header action bar) ─────────────────
  if (variant === "icon") {
    return (
      <button
        id="share-app-btn"
        onClick={handleShare}
        aria-label="Share MyEyes store"
        title="Share MyEyes"
        className={cn(
          "relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200",
          "cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center",
          className
        )}
      >
        {copied ? (
          <Check className="w-5 h-5 text-emerald-500 stroke-[1.75]" />
        ) : (
          <Share2 className="w-5 h-5 stroke-[1.75]" />
        )}
        {copied && (
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg px-2 py-0.5 shadow-sm pointer-events-none">
            Copied!
          </span>
        )}
      </button>
    );
  }

  // ── Row variant (mobile drawer) ───────────────────────────────────────────
  return (
    <button
      id="share-app-drawer-btn"
      onClick={handleShare}
      aria-label="Share MyEyes store"
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold",
        "text-slate-800 hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-emerald-600">Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Share MyEyes</span>
        </>
      )}
    </button>
  );
}
