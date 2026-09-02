import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ValidateCouponRequest, ValidateCouponResponse } from "@/types/discounts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/coupons/validate
 * Body: { code: string; cartSubtotal: number }
 * Returns: ValidateCouponResponse
 *
 * This endpoint is public — no admin auth required.
 * It validates the coupon rules atomically and returns the computed discount amount.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ValidateCouponRequest = await request.json();
    const { code, cartSubtotal } = body;

    if (!code || cartSubtotal == null) {
      return NextResponse.json<ValidateCouponResponse>(
        { valid: false, message: "code and cartSubtotal are required." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");

    const discount = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    });

    // ── Does the code exist? ──────────────────────────────────────────────
    if (!discount) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: "Invalid promo code. Please check and try again.",
      });
    }

    // ── Is it active? ─────────────────────────────────────────────────────
    if (!discount.isActive) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: "This promo code is no longer active.",
      });
    }

    // ── Date window check ─────────────────────────────────────────────────
    const now = new Date();
    if (discount.startsAt > now) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: "This promo code is not yet valid.",
      });
    }
    if (discount.endsAt && discount.endsAt < now) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: "This promo code has expired.",
      });
    }

    // ── Usage limit check ─────────────────────────────────────────────────
    if (discount.usageLimitTotal !== null && discount.timesUsed >= discount.usageLimitTotal) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: "This promo code has reached its usage limit.",
      });
    }

    // ── Minimum cart total check ──────────────────────────────────────────
    if (cartSubtotal < discount.minCartTotal) {
      return NextResponse.json<ValidateCouponResponse>({
        valid: false,
        message: `Minimum order of PKR ${discount.minCartTotal.toLocaleString()} required for this code.`,
      });
    }

    // ── Compute discount amount ───────────────────────────────────────────
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = (cartSubtotal * discount.amount) / 100;
      if (discount.maxDiscountLimit !== null) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountLimit);
      }
    } else {
      // fixed_cart
      discountAmount = Math.min(discount.amount, cartSubtotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json<ValidateCouponResponse>({
      valid: true,
      discountCode: {
        id: discount.id,
        code: discount.code,
        title: discount.title,
        type: discount.type as "percentage" | "fixed_cart",
        amount: discount.amount,
        minCartTotal: discount.minCartTotal,
        maxDiscountLimit: discount.maxDiscountLimit,
        usageLimitTotal: discount.usageLimitTotal,
        timesUsed: discount.timesUsed,
        startsAt: discount.startsAt.toISOString(),
        endsAt: discount.endsAt ? discount.endsAt.toISOString() : null,
        isActive: discount.isActive,
        showAnnouncementBanner: discount.showAnnouncementBanner,
        bannerText: discount.bannerText,
        bannerTheme: discount.bannerTheme as "dark" | "amber" | "emerald" | "crimson",
        showProductBadge: discount.showProductBadge ?? true,
        badgeLabel: discount.badgeLabel ?? "",
        badgeType: (discount.badgeType as "percentage" | "fixed_cart" | "custom") ?? "percentage",
        createdAt: discount.createdAt.toISOString(),
        updatedAt: discount.updatedAt.toISOString(),
      },
      discountAmount,
      message: `🎉 ${discount.title} — ${discount.type === "percentage" ? `${discount.amount}% OFF` : `Rs. ${discount.amount} OFF`} applied!`,
    });
  } catch (error) {
    console.error("[coupons/validate:POST]", error);
    return NextResponse.json<ValidateCouponResponse>(
      { valid: false, message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
