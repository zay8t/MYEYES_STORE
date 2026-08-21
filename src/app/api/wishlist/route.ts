import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch product details for wishlisted items
  const productIds = wishlistItems.map((w) => w.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      frameShape: true,
      stock: true,
      category: true,
      image_url: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const enrichedWishlist = wishlistItems.map((item) => ({
    ...item,
    product: productMap.get(item.productId) || null,
  }));

  return NextResponse.json({ wishlist: enrichedWishlist });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    // Atomic toggle
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false, message: "Removed from wishlist" });
    } else {
      await prisma.wishlistItem.create({
        data: { userId: session.userId, productId },
      });
      return NextResponse.json({ liked: true, message: "Added to wishlist" });
    }
  } catch (error) {
    console.error("[WISHLIST_TOGGLE]", error);
    return NextResponse.json({ error: "Wishlist operation failed." }, { status: 500 });
  }
}
