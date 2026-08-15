import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/check-tid?tid=XXXXXXXX[&excludeOrderId=...]
 * Returns whether a Transaction ID is already in use.
 * Used client-side at checkout for real-time fraud prevention.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tid = searchParams.get("tid")?.trim().toUpperCase();
    const excludeOrderId = searchParams.get("excludeOrderId");

    if (!tid || tid.length < 8) {
      return NextResponse.json({ isDuplicate: false, valid: false });
    }

    const existing = await prisma.order.findFirst({
      where: {
        transactionId: { equals: tid, mode: "insensitive" },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
      select: { id: true, orderNumber: true, paymentStatus: true, createdAt: true },
    });

    if (existing) {
      return NextResponse.json({
        isDuplicate: true,
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        paymentStatus: existing.paymentStatus,
        usedAt: existing.createdAt,
        message: `This Transaction ID has already been used for Order #${existing.orderNumber}. Please upload a valid unique receipt.`,
      });
    }

    return NextResponse.json({ isDuplicate: false, valid: true });
  } catch (error) {
    console.error("TID Check API Error:", error);
    return NextResponse.json({ isDuplicate: false, error: "Check failed" }, { status: 500 });
  }
}

