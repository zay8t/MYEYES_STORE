import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all orders with items, product info, and optical prescription details
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    const mappedOrders = orders.map((order) => {
      const isLahore =
        order.shippingCity?.toLowerCase().includes("lhr") ||
        order.shippingCity?.toLowerCase().includes("lahore") ||
        order.shippingAddress?.toLowerCase().includes("township") ||
        order.customerName?.toLowerCase().includes("zayd");
      return {
        ...order,
        city: order.shippingCity,
        postalCode: isLahore ? "54000" : "44000",
      };
    });

    return NextResponse.json(mappedOrders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
