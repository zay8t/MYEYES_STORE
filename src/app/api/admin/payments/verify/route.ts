import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentAction, rejectPaymentAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payments/verify
 * Payload: { orderId: string, action: "APPROVE" | "REJECT", rejectionReason?: string, adminEmail?: string }
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
        message: "Payment successfully verified and approved. Order is now in production.",
        order: result.order,
      });
    } else if (action === "REJECT") {
      const reason = rejectionReason || "Payment receipt could not be verified by admin";
      const result = await rejectPaymentAction(orderId, adminEmail, reason);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Payment marked as rejected. Customer will be notified to resubmit proof.",
        order: result.order,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Allowed values: 'APPROVE', 'REJECT'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/admin/payments/verify error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error while verifying payment" },
      { status: 500 }
    );
  }
}
