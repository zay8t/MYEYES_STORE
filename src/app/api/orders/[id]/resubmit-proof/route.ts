import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/orders/[id]/resubmit-proof (also /payment-proof)
 * Allows customer to submit or resubmit valid TID, sender name, and receipt screenshot.
 * Updates order paymentStatus to PENDING_VERIFICATION and commits audit log.
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
      advanceReceiptUrl,
      transactionProofUrl,
      paymentSenderName,
      senderAccountTitle,
      paymentSenderPhone,
    } = body;

    const receiptUrl = advanceReceiptUrl || paymentReceiptUrl || transactionProofUrl || null;
    const senderTitle = senderAccountTitle || paymentSenderName || null;

    if (!transactionId && !receiptUrl) {
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
        paymentReceiptUrl: receiptUrl || existingOrder.paymentReceiptUrl,
        transactionProofUrl: receiptUrl || existingOrder.transactionProofUrl,
        paymentSenderName: senderTitle !== null ? senderTitle : existingOrder.paymentSenderName,
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
        notes: `Customer submitted deposit / payment verification proof. TID: ${cleanTid || "None"}. Status: PENDING_VERIFICATION.`,
      },
    });

    return NextResponse.json({
      success: true,
      status: "PENDING_VERIFICATION",
      message: "Payment proof submitted successfully. Your deposit is now in the verification queue.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Proof submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit payment proof" },
      { status: 500 }
    );
  }
}
