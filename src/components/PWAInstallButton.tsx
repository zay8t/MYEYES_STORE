"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// BeforeInstallPromptEvent is not in the standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * PWAInstallButton
 *
 * A subtle, non-intrusive install button that:
 * - Listens for the browser's `beforeinstallprompt` event
 * - Shows only when the PWA is installable (not already installed)
 * - Hides automatically after installation
 * - Does nothing on iOS (iOS uses the native Share → Add to Home Screen flow)
 * - Does nothing when already running in standalone mode
 */
export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Already installed / running in standalone — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // iOS does not support beforeinstallprompt
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide after the app is installed
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <button
      id="pwa-install-btn"
      onClick={handleInstall}
      aria-label="Install MyEyes app"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand hover:bg-brand-dark transition-colors shadow-sm border border-orange-400/30"
      style={{ background: "linear-gradient(135deg, #ff7a00, #ff4800)" }}
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
