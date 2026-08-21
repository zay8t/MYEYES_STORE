import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

interface GuestCartItem {
  productId: string;
  quantity: number;
  selectedColor?: string;
  lensPackageId?: string;
  prescriptionData?: Record<string, unknown>;
}

/**
 * POST /api/cart/sync
 * Receives guest cart, deep-merges into DB cart for the authenticated user.
 * - Increments quantity if same productId + lensPackageId exists
 * - Inserts as new item otherwise
 * Returns the full reconciled cart.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const guestItems: GuestCartItem[] = Array.isArray(body.items) ? body.items : [];

    // Process each guest item
    for (const guestItem of guestItems) {
      const { productId, quantity, selectedColor, lensPackageId, prescriptionData } = guestItem;
      if (!productId) continue;

      // Check for existing matching cart item
      const existing = await prisma.cartItem.findFirst({
        where: {
          userId: session.userId,
          productId,
          lensPackageId: lensPackageId || null,
        },
      });

      if (existing) {
        // Increment quantity
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + (quantity || 1) },
        });
      } else {
        // Insert new item (handle unique constraint)
        try {
          await prisma.cartItem.create({
            data: {
              userId: session.userId,
              productId,
              quantity: quantity || 1,
              selectedColor: selectedColor || null,
              lensPackageId: lensPackageId || null,
              prescriptionData: prescriptionData
                ? (prescriptionData as Record<string, unknown>)
                : undefined,
            },
          });
        } catch {
          // Skip on unique constraint violation
        }
      }
    }

    // Return full reconciled cart
    const reconciledCart = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, cartItems: reconciledCart });
  } catch (error) {
    console.error("[CART_SYNC]", error);
    return NextResponse.json({ error: "Cart sync failed." }, { status: 500 });
  }
}
