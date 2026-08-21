import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        savedFaceShape: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            prescriptions: true,
            wishlist: true,
            cartItems: true,
            orders: true,
          },
        },
        wishlist: {
          select: { productId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { wishlist, _count, ...userBase } = user;

    return NextResponse.json({
      user: {
        ...userBase,
        prescriptionCount: _count.prescriptions,
        wishlistCount: _count.wishlist,
        cartCount: _count.cartItems,
        orderCount: _count.orders,
        wishedProductIds: wishlist.map((w) => w.productId),
      },
    });
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
