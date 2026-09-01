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
    const active = await prisma.discountCode.findFirst({
      where: {
        isActive: true,
        showAnnouncementBanner: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!active) {
      return NextResponse.json({ banner: null });
    }

    return NextResponse.json({
      banner: {
        id: active.id,
        code: active.code,
        bannerText: active.bannerText,
        bannerTheme: active.bannerTheme,
        type: active.type,
        amount: active.amount,
      },
    });
  } catch (error) {
    console.error("[announcements/banner:GET]", error);
    return NextResponse.json({ banner: null });
  }
}
