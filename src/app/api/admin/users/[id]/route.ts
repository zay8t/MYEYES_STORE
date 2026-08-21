import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      savedFaceShape: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
      prescriptions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          isDefault: true,
          odSph: true,
          odCyl: true,
          odAxis: true,
          osSph: true,
          osCyl: true,
          osAxis: true,
          pd: true,
          addPower: true,
          prescriptionType: true,
          slipImageUrl: true,
          notes: true,
          createdAt: true,
        },
      },
      addresses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          recipientName: true,
          phoneNumber: true,
          streetAddress: true,
          city: true,
          province: true,
          postalCode: true,
          isDefault: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true, slug: true } },
            },
          },
        },
      },
      _count: {
        select: { orders: true, prescriptions: true, wishlist: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const totalSpent = user.orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return NextResponse.json({
    user: {
      ...user,
      totalSpent,
      orderCount: user._count.orders,
      prescriptionCount: user._count.prescriptions,
      wishlistCount: user._count.wishlist,
    },
  });
}
