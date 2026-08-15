import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments
 * Query params:
 *   - paymentStatus: PENDING_VERIFICATION | PAID | FAILED | FLAGGED_SUSPICIOUS | ALL
 *   - paymentMethod: BANK_TRANSFER | EASYPAISA | JAZZCASH | COD | ALL
 *   - search: string (matches orderNumber, customerName, customerPhone, transactionId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get("paymentStatus") || searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const search = searchParams.get("search")?.trim().toLowerCase();

    const whereClause: Record<string, unknown> = {};

    if (orderNumber) {
      whereClause.orderNumber = { contains: orderNumber, mode: "insensitive" };
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      if (paymentStatus === "OCR_MATCHED") {
        whereClause.isOcrMatched = true;
      } else {
        whereClause.paymentStatus = paymentStatus;
      }
    }

    if (paymentMethod && paymentMethod !== "ALL") {
      whereClause.paymentMethod = paymentMethod;
    } else {
      whereClause.paymentMethod = {
        in: ["BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "ALFALAH", "NAYAPAY", "SADAPAY"],
      };
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
        { paymentSenderName: { contains: search, mode: "insensitive" } },
        { paymentSenderPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: { select: { name: true, category: true } },
            prescription: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment orders" },
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
        { success: false, error: "orderId and action are required" },
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
        message: "Payment approved successfully",
        order: result.order,
      });
    } else if (action === "REJECT") {
      const reason = rejectionReason || "Payment receipt could not be verified";
      const result = await rejectPaymentAction(orderId, adminEmail, reason);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Payment rejected successfully",
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
      { success: false, error: "Failed to process payment action" },
      { status: 500 }
    );
  }
}
