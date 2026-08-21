import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

/**
 * GET /api/orders/mine
 * Returns all orders for the authenticated user linked via userId
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { customerEmail: session.email },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      shippingCity: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          price: true,
          selectedLensName: true,
          product: {
            select: { name: true, slug: true, image_url: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ orders });
}
