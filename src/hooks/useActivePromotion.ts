"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActivePromotion } from "@/types/discounts";

let cachedPromotion: ActivePromotion | null | undefined = undefined;
let isFetching = false;
const listeners = new Set<(promo: ActivePromotion | null) => void>();

export function useActivePromotion() {
  const [promotion, setPromotion] = useState<ActivePromotion | null>(
    cachedPromotion !== undefined ? cachedPromotion : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(cachedPromotion === undefined);

  useEffect(() => {
    const handleUpdate = (promo: ActivePromotion | null) => {
      setPromotion(promo);
      setIsLoading(false);
    };

    listeners.add(handleUpdate);

    if (cachedPromotion === undefined && !isFetching) {
      isFetching = true;
      fetch("/api/promotions/active", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { promotion: null }))
        .then((data: { promotion?: ActivePromotion | null }) => {
          cachedPromotion = data.promotion || null;
          isFetching = false;
          listeners.forEach((listener) => listener(cachedPromotion!));
        })
        .catch(() => {
          cachedPromotion = null;
          isFetching = false;
          listeners.forEach((listener) => listener(null));
        });
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const calculateDiscountedPrice = useCallback(
    (basePrice: number) => {
      if (!promotion || !promotion.showProductBadge || basePrice <= 0) {
        return {
          originalPrice: basePrice,
          promotionalPrice: basePrice,
          hasDiscount: false,
          discountAmount: 0,
        };
      }

      let discountAmount = 0;
      if (promotion.type === "percentage") {
        discountAmount = (basePrice * promotion.amount) / 100;
      } else {
        discountAmount = Math.min(promotion.amount, basePrice);
      }

      const promotionalPrice = Math.max(0, Math.round(basePrice - discountAmount));
      return {
        originalPrice: basePrice,
        promotionalPrice,
        hasDiscount: promotionalPrice < basePrice,
        discountAmount,
      };
    },
    [promotion]
  );

  return {
    promotion,
    isLoading,
    calculateDiscountedPrice,
  };
}

/** Function to invalidate promotion cache when admin modifies discounts */
export function invalidatePromotionCache() {
  cachedPromotion = undefined;
}
