import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/announcements/banner
 * Returns the first active discount code with showAnnouncementBanner = true
 * that is within its valid date window.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const now = new Date();
    
    // First priority: active discount explicitly marked to show announcement banner
    let active = await prisma.discountCode.findFirst({
      where: {
        isActive: true,
        showAnnouncementBanner: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Second priority: any active discount within valid date range
    if (!active) {
      active = await prisma.discountCode.findFirst({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!active) {
      return NextResponse.json({ banner: null });
    }

    const discountLabel =
      active.type === "percentage"
        ? `${active.amount}% OFF`
        : `Rs. ${active.amount.toLocaleString()} OFF`;

    const formattedText =
      active.bannerText?.trim() ||
      `🎉 Special Offer: Use code ${active.code} to get ${discountLabel} sitewide! Limited time only.`;

    return NextResponse.json({
      banner: {
        id: active.id,
        code: active.code,
        title: active.title,
        bannerText: formattedText,
        bannerTheme: active.bannerTheme || "dark",
        type: active.type,
        amount: active.amount,
        minCartTotal: active.minCartTotal || 0,
        endsAt: active.endsAt ? active.endsAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("[announcements/banner:GET]", error);
    return NextResponse.json({ banner: null });
  }
}
