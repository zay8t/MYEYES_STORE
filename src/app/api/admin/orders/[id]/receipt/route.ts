import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isLahore =
      order.shippingCity?.toLowerCase().includes("lhr") ||
      order.shippingCity?.toLowerCase().includes("lahore") ||
      order.shippingAddress?.toLowerCase().includes("township") ||
      order.customerName?.toLowerCase().includes("zayd");

    const receiptPayload = {
      ...order,
      city: order.shippingCity,
      postalCode: isLahore ? "54000" : "44000",
    };

    return NextResponse.json(receiptPayload);
  } catch (error) {
    console.error("Failed to fetch order receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate order receipt" },
      { status: 500 }
    );
  }
}
