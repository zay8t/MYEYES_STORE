import type { ActivePromotion, DiscountCode } from "@/types/discounts";
import { formatPrice } from "@/lib/utils";

export interface CardPricingResult {
  finalPrice: number;
  originalPrice: number | null;
  badgeText: string | null;
  hasDiscount: boolean;
  discountAmount: number;
  formattedFinalPrice: string;
  formattedOriginalPrice: string | null;
}

/**
 * Calculates discounted price given a basePrice and active discount configuration.
 */
export function calculateDiscountAmount(
  basePrice: number,
  discount: ActivePromotion | DiscountCode | null | undefined
): number {
  if (!discount || !discount.amount || basePrice <= 0) return 0;

  if (discount.type === "percentage") {
    return Math.round((basePrice * discount.amount) / 100);
  }
  return Math.min(Math.round(discount.amount), basePrice);
}

/**
 * Universal Card Pricing Helper:
 * Produces final calculated price, original price for strikethrough, and promotional badge text.
 */
export function getCardPricing(
  basePrice: number,
  activeDiscount: ActivePromotion | DiscountCode | null | undefined
): CardPricingResult {
  const isEligible =
    Boolean(activeDiscount) &&
    (activeDiscount?.isActive !== false) &&
    (activeDiscount?.showProductBadge !== false) &&
    basePrice > 0;

  if (!isEligible || !activeDiscount) {
    return {
      finalPrice: basePrice,
      originalPrice: null,
      badgeText: null,
      hasDiscount: false,
      discountAmount: 0,
      formattedFinalPrice: formatPrice(basePrice),
      formattedOriginalPrice: null,
    };
  }

  const discountAmount = calculateDiscountAmount(basePrice, activeDiscount);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const badgeText =
    activeDiscount.badgeLabel?.trim() ||
    (activeDiscount.type === "percentage"
      ? `${activeDiscount.amount}% OFF`
      : `SAVE Rs. ${activeDiscount.amount}`);

  return {
    finalPrice,
    originalPrice: finalPrice < basePrice ? basePrice : null,
    badgeText: finalPrice < basePrice ? badgeText : null,
    hasDiscount: finalPrice < basePrice,
    discountAmount,
    formattedFinalPrice: formatPrice(finalPrice),
    formattedOriginalPrice: finalPrice < basePrice ? formatPrice(basePrice) : null,
  };
}
