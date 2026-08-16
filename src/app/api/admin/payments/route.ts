import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const PREPAID_METHODS: PaymentMethod[] = [
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.EASYPAISA,
  PaymentMethod.JAZZCASH,
  PaymentMethod.RAAST,
];

/**
 * GET /api/admin/payments
 * Strictly scoped to online prepaid payments (EasyPaisa, JazzCash, Bank Transfer, Raast).
 * Completely excludes Cash on Delivery (COD) orders.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentStatusParam = searchParams.get("paymentStatus") || searchParams.get("status");
    const paymentMethodParam = searchParams.get("paymentMethod");
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const search = searchParams.get("search")?.trim();

    // Base condition: Strictly online prepaid methods ONLY, never COD
    const whereClause: Record<string, unknown> = {
      paymentMethod: {
        in: PREPAID_METHODS,
        not: PaymentMethod.COD,
      },
    };

    // Specific Payment Method filter if provided and not ALL
    if (paymentMethodParam && paymentMethodParam !== "ALL") {
      const upperMethod = paymentMethodParam.toUpperCase() as PaymentMethod;
      if (PREPAID_METHODS.includes(upperMethod)) {
        whereClause.paymentMethod = upperMethod;
      } else if (upperMethod === PaymentMethod.COD) {
        // If COD is requested in this endpoint, return empty list because COD is excluded from verification
        return NextResponse.json({ success: true, count: 0, orders: [] });
      }
    }

    // Status filtering
    if (paymentStatusParam && paymentStatusParam !== "ALL") {
      const upperStatus = paymentStatusParam.toUpperCase();
      if (upperStatus === "PENDING_VERIFICATION") {
        whereClause.paymentStatus = {
          in: [PaymentStatus.PENDING_VERIFICATION, PaymentStatus.UNPAID],
        };
      } else if (upperStatus === "PAID") {
        whereClause.paymentStatus = PaymentStatus.PAID;
      } else if (upperStatus === "FAILED") {
        whereClause.paymentStatus = PaymentStatus.FAILED;
      } else if (Object.values(PaymentStatus).includes(upperStatus as PaymentStatus)) {
        whereClause.paymentStatus = upperStatus as PaymentStatus;
      }
    }

    // Exact order number query
    if (orderNumber) {
      whereClause.orderNumber = { contains: orderNumber, mode: "insensitive" };
    }

    // Search query matching multiple fields
    if (search) {
      whereClause.AND = [
        {
          paymentMethod: { in: PREPAID_METHODS, not: PaymentMethod.COD },
        },
        {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { transactionId: { contains: search, mode: "insensitive" } },
            { paymentSenderName: { contains: search, mode: "insensitive" } },
            { paymentSenderPhone: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
      delete whereClause.paymentMethod;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        currency: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        transactionId: true,
        paymentReceiptUrl: true,
        paymentSenderName: true,
        paymentSenderPhone: true,
        verifiedAt: true,
        verifiedBy: true,
        rejectionReason: true,
        customerNotified: true,
        ocrExtractedTid: true,
        ocrConfidenceScore: true,
        isOcrMatched: true,
        flaggedSuspicious: true,
        createdAt: true,
        updatedAt: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        shippingAddress: true,
        shippingCity: true,
        items: {
          select: {
            id: true,
            productId: true,
            price: true,
            quantity: true,
            selectedLensName: true,
            totalAmount: true,
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                images: true,
              },
            },
            prescription: {
              select: {
                id: true,
                lensType: true,
                odSph: true,
                odCyl: true,
                odAxis: true,
                osSph: true,
                osCyl: true,
                osAxis: true,
                pd: true,
                fileUrl: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            actor: true,
            notes: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch online prepaid payments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments
 * Body: { orderId: string, action: "APPROVE" | "REJECT", rejectionReason?: string, adminEmail?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, rejectionReason, adminEmail = "admin@myeyes.pk" } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: "orderId and action ('APPROVE' | 'REJECT') are required" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const result = await verifyPaymentAction(orderId, adminEmail);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Payment approved successfully. Order moved to processing.",
        order: result.order,
      });
    } else if (action === "REJECT") {
      const reason = rejectionReason || "Payment receipt or TID could not be verified";
      const result = await rejectPaymentAction(orderId, adminEmail, reason);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Payment rejected. Customer can re-upload proof.",
        order: result.order,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'APPROVE' or 'REJECT'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/admin/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process payment verification action" },
      { status: 500 }
    );
  }
}
