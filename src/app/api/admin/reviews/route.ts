import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch all reviews (filterable by status) for admin moderation panel
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'pending' | 'approved' | 'all'

    const whereClause: Record<string, unknown> = {};
    if (status === "pending") whereClause.isApproved = false;
    if (status === "approved") whereClause.isApproved = true;
    // 'all' or unset → no filter

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, price: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingCount = await prisma.review.count({ where: { isApproved: false } });

    return NextResponse.json({ success: true, reviews, pendingCount }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN] Fetch reviews error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// PATCH: Toggle approve/unpublish a review
export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { reviewId, isApproved } = body;

    if (!reviewId) {
      return NextResponse.json({ success: false, error: "Review ID is required" }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: Boolean(isApproved) },
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, review: updatedReview }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN] Update review error:", error);
    return NextResponse.json({ success: false, error: "Failed to update review status" }, { status: 500 });
  }
}

// DELETE: Permanently remove a spam or unwanted review
export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ success: false, error: "Review ID is required" }, { status: 400 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true, message: "Review deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN] Delete review error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete review" }, { status: 500 });
  }
}
