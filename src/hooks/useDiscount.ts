"use client";

import { useActivePromotion, invalidatePromotionCache } from "./useActivePromotion";
import { getCardPricing, CardPricingResult } from "@/lib/pricing/discountEngine";
import type { ActivePromotion } from "@/types/discounts";

export function useDiscount() {
  const { promotion, isLoading } = useActivePromotion();

  const getPricing = (basePrice: number): CardPricingResult => {
    return getCardPricing(basePrice, promotion);
  };

  return {
    activeDiscount: promotion,
    isLoading,
    getPricing,
    getCardPricing: (basePrice: number) => getCardPricing(basePrice, promotion),
    invalidatePromotionCache,
  };
}

export { getCardPricing, invalidatePromotionCache };
export type { CardPricingResult, ActivePromotion };
