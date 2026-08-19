"use client";

import { useEffect, useState } from "react";
import { useIsStandalone } from "@/hooks/useIsStandalone";

/**
 * StandaloneBodyManager
 *
 * Attaches `.standalone-mode` and `.has-bottom-nav` CSS classes to <body>
 * strictly when running inside an installed standalone PWA / APK context.
 * This dynamically applies bottom padding (via `.has-bottom-nav main`) only in standalone mode.
 */
export default function StandaloneBodyManager() {
  const isStandalone = useIsStandalone();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return null;
}
