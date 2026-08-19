"use client";

import { useState, useEffect } from "react";

/**
 * useIsStandalone
 *
 * Accurately detects whether the app is running as an installed standalone
 * PWA or APK (TWA), returning true strictly in standalone mode.
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = () => checkStandalone();
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return isStandalone;
}
