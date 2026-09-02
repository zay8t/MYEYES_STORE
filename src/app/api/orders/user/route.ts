import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/orders/user
 * Returns all orders exclusively for the authenticated user (or matching user email/id)
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const searchParams = request.nextUrl.searchParams;
  const emailParam = searchParams.get("email");
  const userIdParam = searchParams.get("userId");

  const effectiveUserId = session?.userId || userIdParam;
  const effectiveEmail = session?.email || emailParam;

  if (!effectiveUserId && !effectiveEmail) {
    return NextResponse.json({ error: "Unauthorized: Please log in to view orders" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(effectiveUserId ? [{ userId: effectiveUserId }] : []),
          ...(effectiveEmail ? [{ customerEmail: effectiveEmail }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    console.error("Failed to fetch user orders:", err);
    return NextResponse.json({ error: "Failed to retrieve orders" }, { status: 500 });
  }
}
