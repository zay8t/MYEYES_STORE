import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/orders/[id]
 * Fetch order details by orderNumber or id for customer tracking & receipt view.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: cleanId },
          { id: cleanId },
          { orderNumber: { equals: cleanId, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingFee: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        totalAmount: true,
        currency: true,
        transactionId: true,
        paymentReceiptUrl: true,
        paymentSenderName: true,
        paymentSenderPhone: true,
        verifiedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            price: true,
            quantity: true,
            framePrice: true,
            lensFinalPrice: true,
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
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
