import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

/**
 * POST /api/wishlist/sync
 * Merges guest-liked product IDs into the user's wishlist on account creation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productIds } = await request.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    let synced = 0;
    for (const productId of productIds) {
      try {
        await prisma.wishlistItem.upsert({
          where: { userId_productId: { userId: session.userId, productId } },
          create: { userId: session.userId, productId },
          update: {},
        });
        synced++;
      } catch {
        // Skip on error (invalid productId, etc.)
      }
    }

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    console.error("[WISHLIST_SYNC]", error);
    return NextResponse.json({ error: "Wishlist sync failed." }, { status: 500 });
  }
}
