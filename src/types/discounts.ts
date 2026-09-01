// ─────────────────────────────────────────────────────────────────────────────
// Discount / Promo Code Type Definitions
// MY EYES — Discount Engine v1.0
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountType = "percentage" | "fixed_cart";
export type BannerTheme = "dark" | "amber" | "emerald" | "crimson";

export interface DiscountCode {
  id: string;
  code: string; // normalized UPPERCASE, unique
  title: string; // e.g. "Holiday Sale"
  type: DiscountType;
  amount: number; // 20 for 20% or 500 for Rs. 500
  minCartTotal: number; // minimum cart subtotal to activate (0 = no minimum)
  maxDiscountLimit: number | null; // PKR ceiling for percentage discounts
  usageLimitTotal: number | null; // null = unlimited
  timesUsed: number; // auto-incremented on order confirmation
  startsAt: string; // ISO date string
  endsAt: string | null; // ISO date string, null = no expiry
  isActive: boolean;

  // Announcement Banner Controls
  showAnnouncementBanner: boolean;
  bannerText: string; // e.g. "🎉 Flash Sale: Use code HOLIDAY20 for 20% OFF!"
  bannerTheme: BannerTheme;

  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountPayload {
  code: string;
  title: string;
  type: DiscountType;
  amount: number;
  minCartTotal?: number;
  maxDiscountLimit?: number | null;
  usageLimitTotal?: number | null;
  startsAt: string;
  endsAt?: string | null;
  isActive?: boolean;
  showAnnouncementBanner?: boolean;
  bannerText?: string;
  bannerTheme?: BannerTheme;
}

export interface UpdateDiscountPayload extends Partial<CreateDiscountPayload> {}

export interface ValidateCouponRequest {
  code: string;
  cartSubtotal: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discountCode?: DiscountCode;
  discountAmount?: number; // computed Rs. deduction
  message?: string;
}
