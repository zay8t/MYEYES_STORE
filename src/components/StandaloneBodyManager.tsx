"use client";

import { useEffect } from "react";
import { useIsStandalone } from "@/hooks/useIsStandalone";

/**
 * StandaloneBodyManager
 *
 * A zero-render client component that attaches CSS class tokens to <body>
 * when the app is running as an installed PWA or TWA. This enables
 * the `.standalone-mode` and `.has-bottom-nav` CSS rules in globals.css to
 * activate native touch ergonomics without any inline styles.
 *
 * No DOM output — renders nothing to the page.
 */
export default function StandaloneBodyManager() {
  const { isStandalone, mounted } = useIsStandalone();

  useEffect(() => {
    if (!mounted) return;

    const body = document.body;

    if (isStandalone) {
      body.classList.add("standalone-mode", "has-bottom-nav");
    } else {
      body.classList.remove("standalone-mode", "has-bottom-nav");
    }

    return () => {
      body.classList.remove("standalone-mode", "has-bottom-nav");
    };
  }, [isStandalone, mounted]);

  // This component renders nothing — it only manages body classes.
  return null;
}
