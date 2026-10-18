import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Public — only return approved reviews for storefront visitors
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: paramId } = await context.params;

    // Resolve actual productId whether param is CUID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: paramId }, { slug: paramId }],
      },
      select: { id: true },
    });

    const targetProductId = product ? product.id : paramId;

    const reviews = await prisma.review.findMany({
      where: { productId: targetProductId, isApproved: true },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
          )
        : 0;

    return NextResponse.json(
      { success: true, averageRating, totalReviews, reviews },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Customers submit a review — defaults to isApproved: false (pending moderation)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: paramId } = await context.params;
    const body = await req.json();
    const { rating, comment, userName, userEmail } = body;

    if (!rating || !userName || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: rating, userName, and comment are required." },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    // Verify the product exists (by id or slug)
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: paramId }, { slug: paramId }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    const newReview = await prisma.review.create({
      data: {
        rating: ratingNum,
        comment: String(comment).trim(),
        userName: String(userName).trim(),
        userEmail: userEmail ? String(userEmail).trim() : null,
        productId: product.id,
        isApproved: false, // Requires admin moderation before going live
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your review has been submitted and will appear after verification.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products/[id]/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review." },
      { status: 500 }
    );
  }
}
