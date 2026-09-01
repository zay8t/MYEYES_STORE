import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ActivePromotion } from "@/types/discounts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/promotions/active
 * Returns the latest active promotional campaign/discount code that is within its valid date window.
 * Public endpoint — no auth required.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const active = await prisma.discountCode.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!active) {
      return NextResponse.json<{ promotion: null }>({ promotion: null });
    }

    const defaultLabel =
      active.type === "percentage"
        ? `${active.amount}% OFF`
        : `Rs. ${active.amount} OFF`;

    const promotion: ActivePromotion = {
      id: active.id,
      code: active.code,
      title: active.title,
      type: active.type as "percentage" | "fixed_cart",
      amount: active.amount,
      showProductBadge: active.showProductBadge,
      badgeLabel: active.badgeLabel?.trim() ? active.badgeLabel.trim() : defaultLabel,
      badgeType: (active.badgeType as "percentage" | "fixed_cart" | "custom") || "percentage",
      bannerText: active.bannerText,
      bannerTheme: active.bannerTheme as "dark" | "amber" | "emerald" | "crimson",
      showAnnouncementBanner: active.showAnnouncementBanner,
    };

    return NextResponse.json<{ promotion: ActivePromotion }>({ promotion });
  } catch (error) {
    console.error("[promotions/active:GET]", error);
    return NextResponse.json<{ promotion: null }>({ promotion: null });
  }
}
