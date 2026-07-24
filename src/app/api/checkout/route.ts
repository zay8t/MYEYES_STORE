import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2026-06-24.dahlia" as unknown as undefined }) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerName = "Jane Doe", customerEmail = "jane.doe@example.com" } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItemsData = [];
    const stripeLineItems = [];

    for (const item of items) {
      const itemTotal = (parseFloat(item.price) || 0) * (item.quantity || 1);
      totalAmount += itemTotal;

      // Check if item has prescription
      let prescriptionId: string | undefined;
      if (item.prescription && (item.prescription.odSph !== undefined || item.prescription.lensUsage)) {
        const rxRecord = await prisma.prescription.create({
          data: {
            lensType: item.prescription.lensUsage || item.prescription.lensMaterial || "Prescription Lenses",
            odSph: parseFloat(item.prescription.odSph) || 0,
            odCyl: item.prescription.odCyl !== null ? parseFloat(item.prescription.odCyl) : null,
            odAxis: item.prescription.odAxis ? parseInt(item.prescription.odAxis, 10) : null,
            osSph: parseFloat(item.prescription.osSph) || 0,
            osCyl: item.prescription.osCyl !== null ? parseFloat(item.prescription.osCyl) : null,
            osAxis: item.prescription.osAxis ? parseInt(item.prescription.osAxis, 10) : null,
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

      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: item.prescription
              ? `Rx: ${item.prescription.lensUsage || "Prescription"} (${item.prescription.lensMaterial || "1.56 Index"}) | OD SPH ${item.prescription.odSph || "0.00"} | OS SPH ${item.prescription.osSph || "0.00"} | PD ${item.prescription.pd || "63"}mm`
              : "Standard Frame",
          },
          unit_amount: Math.round((parseFloat(item.price) || 0) * 100),
        },
        quantity: item.quantity || 1,
      });
    }

    const stripeSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        totalAmount,
        status: "PENDING",
        stripeSessionId,
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

    // If Stripe client is configured, create real Stripe Checkout Session
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: stripeLineItems,
        mode: "payment",
        success_url: `${request.headers.get("origin") || "http://localhost:3000"}/admin/orders?success=true`,
        cancel_url: `${request.headers.get("origin") || "http://localhost:3000"}?canceled=true`,
        customer_email: customerEmail,
        metadata: {
          orderId: order.id,
          rxSummary: JSON.stringify(
            items.map((i: Record<string, unknown>) => ({ name: i.name, rx: i.prescription }))
          ),
        },
      });

      return NextResponse.json({ url: session.url, orderId: order.id });
    }

    // Direct return for instant order completion in demo/local mode
    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout session" },
      { status: 500 }
    );
  }
}
