"use client";

import { useState, useEffect } from "react";

/**
 * useIsStandalone
 *
 * Accurately detects whether the app is running as an installed PWA
 * or as a Trusted Web Activity (Android app) rather than a regular browser tab.
 *
 * Returns:
 *   isStandalone — true when running in standalone/installed context
 *   mounted      — true after client-side hydration (safe to render standalone-only UI)
 */
export function useIsStandalone(): { isStandalone: boolean; mounted: boolean } {
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkStandalone = () => {
      // 1. CSS media query — covers Android Chrome, Edge, Desktop PWA
      const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;

      // 2. iOS Safari "Add to Home Screen"
      const iosStandalone = Boolean(
        (navigator as unknown as { standalone?: boolean }).standalone
      );

      // 3. Android TWA / WebAPK launched via app intent
      const isTwa =
        document.referrer.startsWith("android-app://") ||
        window.location.href.includes("source=twa");

      setIsStandalone(mediaStandalone || iosStandalone || isTwa);
    };

    checkStandalone();

    // Re-evaluate if the display mode changes (e.g., user installs mid-session)
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = () => checkStandalone();
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return { isStandalone, mounted };
}
