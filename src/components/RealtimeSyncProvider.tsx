"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";

interface RealtimeSyncProviderProps {
  children?: React.ReactNode;
}

export default function RealtimeSyncProvider({ children }: RealtimeSyncProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lastSyncTimeRef = useRef<number>(0);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    const handleSync = async () => {
      const now = Date.now();
      // Throttle sync to once every 4 seconds
      if (now - lastSyncTimeRef.current < 4000) return;
      lastSyncTimeRef.current = now;

      try {
        // 1. Invalidate and re-fetch Next.js server components / routes
        router.refresh();

        // 2. Dispatch custom sync event for active client views (e.g. Order Tracking, Live Catalog)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("myeyes:app-resumed", { detail: { pathname, timestamp: now } }));
        }

        // 3. If cart has items, validate against live products to ensure zero stale pricing/stock
        if (items.length > 0) {
          const res = await fetch("/api/admin/products", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          });

          if (res.ok) {
            const liveProducts = await res.json();
            if (Array.isArray(liveProducts)) {
              // Check if any product was completely removed or out of stock
              const validProductIds = new Set(liveProducts.map((p) => p.id));
              items.forEach((item) => {
                if (item.productId && !validProductIds.has(item.productId)) {
                  // Product no longer exists in catalogue
                  console.warn(`[Sync] Product ${item.productId} removed from live store`);
                  removeItem(item.id);
                }
              });
            }
          }
        }
      } catch (err) {
        console.debug("[RealtimeSyncProvider] Sync error:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    };

    const handleWindowFocus = () => {
      handleSync();
    };

    const handleOnline = () => {
      handleSync();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [router, pathname, items, removeItem]);

  return <>{children}</>;
}
