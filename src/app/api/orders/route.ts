import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      paymentMethod,
      transactionProofUrl,
      items,
    } = body;

    // Validate customer details
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !shippingAddress ||
      !shippingCity ||
      !paymentMethod
    ) {
      return NextResponse.json(
        { error: "All customer details and payment method are required." },
        { status: 400 }
      );
    }

    // Validate payment proof if local manual payment is chosen
    if (
      (paymentMethod === "EASYPAISA" || paymentMethod === "ALFALAH") &&
      !transactionProofUrl
    ) {
      return NextResponse.json(
        { error: "Transaction proof/screenshot is required for direct payment options." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Your shopping bag is empty." },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      subtotal += (parseFloat(item.price) || 0) * (item.quantity || 1);

      // Check if item has prescription
      let prescriptionId: string | undefined;
      if (
        item.prescription &&
        (item.prescription.odSph !== undefined || item.prescription.lensUsage)
      ) {
        const rxRecord = await prisma.prescription.create({
          data: {
            lensType:
              item.prescription.lensUsage ||
              item.prescription.lensMaterial ||
              "Prescription Lenses",
            odSph: parseFloat(item.prescription.odSph) || 0,
            odCyl:
              item.prescription.odCyl !== null
                ? parseFloat(item.prescription.odCyl)
                : null,
            odAxis: item.prescription.odAxis
              ? parseInt(item.prescription.odAxis, 10)
              : null,
            osSph: parseFloat(item.prescription.osSph) || 0,
            osCyl:
              item.prescription.osCyl !== null
                ? parseFloat(item.prescription.osCyl)
                : null,
            osAxis: item.prescription.osAxis
              ? parseInt(item.prescription.osAxis, 10)
              : null,
            pd: parseFloat(item.prescription.pd) || 63,
            fileUrl: item.prescription.rxFileUrl || null,
          },
        });
        prescriptionId = rxRecord.id;
      }

      orderItemsData.push({
        productId: item.productId,
        prescriptionId: prescriptionId || null,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
      });
    }

    const shippingFee = 250; // Fixed 250 PKR
    const totalAmount = subtotal + shippingFee;

    // Create unique random placeholder for stripeSessionId to satisfy unique db constraint if set
    const mockSessionId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create Order in SQLite
    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        paymentMethod,
        transactionProofUrl: transactionProofUrl || null,
        shippingFee,
        totalAmount,
        status: "PENDING",
        stripeSessionId: mockSessionId,
        items: {
          create: orderItemsData,
        },
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

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: order.totalAmount,
    }, { status: 201 });
  } catch (error) {
    console.error("Orders API Error:", error);
    return NextResponse.json(
      { error: "Failed to process and save customer order." },
      { status: 500 }
    );
  }
}
