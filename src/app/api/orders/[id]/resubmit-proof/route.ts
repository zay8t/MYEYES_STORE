import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/orders/[id]/resubmit-proof
 * Allows customer to resubmit valid TID and receipt screenshot after payment rejection.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const body = await request.json();
    const {
      transactionId,
      paymentReceiptUrl,
      paymentSenderName,
      paymentSenderPhone,
    } = body;

    if (!transactionId && !paymentReceiptUrl) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid Transaction ID (TID) or receipt screenshot." },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: cleanId },
          { id: cleanId },
          { orderNumber: { equals: cleanId, mode: "insensitive" } },
        ],
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const cleanTid = transactionId ? String(transactionId).trim().toUpperCase() : existingOrder.transactionId;

    // Check if new TID is already used in a different order
    if (cleanTid && cleanTid !== existingOrder.transactionId) {
      const duplicate = await prisma.order.findFirst({
        where: {
          transactionId: cleanTid,
          id: { not: existingOrder.id },
        },
        select: { orderNumber: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Transaction ID ${cleanTid} is already in use by order #${duplicate.orderNumber}. Please check your receipt.`,
          },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        paymentStatus: PaymentStatus.PENDING_VERIFICATION,
        rejectionReason: null,
        transactionId: cleanTid,
        paymentReceiptUrl: paymentReceiptUrl || existingOrder.paymentReceiptUrl,
        transactionProofUrl: paymentReceiptUrl || existingOrder.transactionProofUrl,
        paymentSenderName: paymentSenderName !== undefined ? paymentSenderName : existingOrder.paymentSenderName,
        paymentSenderPhone: paymentSenderPhone !== undefined ? paymentSenderPhone : existingOrder.paymentSenderPhone,
        verifiedAt: null,
        verifiedBy: null,
        flaggedSuspicious: false,
        isOcrMatched: false,
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        orderId: existingOrder.id,
        action: "SUBMITTED",
        actor: "CUSTOMER",
        notes: `Customer resubmitted payment verification proof. New TID: ${cleanTid || "None"}. Status reset to PENDING_VERIFICATION.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment proof resubmitted successfully. Your payment is under review.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Resubmit proof error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resubmit payment proof" },
      { status: 500 }
    );
  }
}
