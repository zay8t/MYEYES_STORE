import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextOrderNumber } from "@/lib/order-number";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PrescriptionInput {
  lensUsage?: string;
  lensMaterial?: string;
  odSph?: string | number;
  odCyl?: string | number | null;
  odAxis?: string | number | null;
  osSph?: string | number;
  osCyl?: string | number | null;
  osAxis?: string | number | null;
  pd?: string | number;
  rxFileUrl?: string | null;
}

interface OrderItemInput {
  productId: string;
  price: string | number;
  quantity?: number;
  prescription?: PrescriptionInput;
}

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
    const itemsWithPrescription: { item: OrderItemInput; prescriptionId?: string }[] = [];

    for (const item of items as OrderItemInput[]) {
      subtotal += (parseFloat(String(item.price)) || 0) * (item.quantity || 1);
      itemsWithPrescription.push({ item });
    }

    const shippingFee = 250; // Fixed 250 PKR
    const totalAmount = subtotal + shippingFee;

    // Create unique random placeholder for stripeSessionId to satisfy unique db constraint if set
    const mockSessionId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create Order and assign permanent sequential 8-digit orderNumber inside a Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = [];

      for (const entry of itemsWithPrescription) {
        const item = entry.item;
        let prescriptionId: string | undefined;

        if (
          item.prescription &&
          (item.prescription.odSph !== undefined || item.prescription.lensUsage)
        ) {
          const rxRecord = await tx.prescription.create({
            data: {
              lensType:
                item.prescription.lensUsage ||
                item.prescription.lensMaterial ||
                "Prescription Lenses",
              odSph: parseFloat(String(item.prescription.odSph)) || 0,
              odCyl:
                item.prescription.odCyl !== null && item.prescription.odCyl !== undefined
                  ? parseFloat(String(item.prescription.odCyl))
                  : null,
              odAxis: item.prescription.odAxis !== null && item.prescription.odAxis !== undefined
                ? parseInt(String(item.prescription.odAxis), 10)
                : null,
              osSph: parseFloat(String(item.prescription.osSph)) || 0,
              osCyl:
                item.prescription.osCyl !== null && item.prescription.osCyl !== undefined
                  ? parseFloat(String(item.prescription.osCyl))
                  : null,
              osAxis: item.prescription.osAxis !== null && item.prescription.osAxis !== undefined
                ? parseInt(String(item.prescription.osAxis), 10)
                : null,
              pd: parseFloat(String(item.prescription.pd)) || 63,
              fileUrl: item.prescription.rxFileUrl || null,
            },
          });
          prescriptionId = rxRecord.id;
        }

        orderItemsData.push({
          productId: item.productId,
          prescriptionId: prescriptionId || null,
          price: parseFloat(String(item.price)) || 0,
          quantity: item.quantity || 1,
        });
      }

      const orderNumber = await generateNextOrderNumber(tx);

      return await tx.order.create({
        data: {
          orderNumber,
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
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
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
