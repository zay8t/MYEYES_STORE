"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSAL_KEY = "myeyes_pwa_install_dismissed_v1";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // 1. Check if already running in standalone mode (iOS or Android/Desktop PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);

    if (isStandalone) return;

    // 2. Check if user previously dismissed the banner
    try {
      const dismissedTime = localStorage.getItem(DISMISSAL_KEY);
      if (dismissedTime) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          // Keep dismissed for 7 days
          return;
        }
      }
    } catch {
      // Storage access might fail in private browsing
    }

    setIsDismissed(false);

    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Delay showing banner by 3 seconds for non-intrusive presentation
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("PWA install error:", err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    } catch {
      // Fallback ignore
    }
  };

  if (isDismissed || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Install MyEyes App"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/95 text-slate-900 p-4 shadow-xl backdrop-blur-xl border border-slate-200/80 ring-1 ring-black/5">
        {/* Subtle brand accent line */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-amber-400 via-[#ff7a00] to-amber-400 opacity-80" />

        <div className="flex items-center gap-3.5">
          {/* App Icon */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-200 shadow-sm">
            <Image
              src="/pwa-192x192.png"
              alt="MyEyes App Icon"
              width={48}
              height={48}
              className="h-full w-full object-contain rounded-lg"
            />
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              Install MyEyes App
            </h4>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              Fast ordering, instant tracking & offline access
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 -mr-1 -mt-1 self-start rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Not now
          </button>
          <button
            id="pwa-floating-install-btn"
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#ff7a00] hover:bg-[#e56e00] transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
