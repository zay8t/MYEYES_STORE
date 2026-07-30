import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextOrderNumber } from "@/lib/order-number";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
  lensBasePriceKey?: string | null;
  lensBasePriceValue?: number | null;
  lensMultiplier?: number | null;
  lensFinalPrice?: number | null;
  framePrice?: number | null;
}

interface OrderItemInput {
  productId: string;
  price: string | number;
  quantity?: number;
  prescription?: PrescriptionInput;
}

function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("03")) {
    digits = "923" + digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith("3")) {
    digits = "92" + digits;
  }
  return digits;
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

    const shippingFee = 250;
    const totalAmount = subtotal + shippingFee;
    const mockSessionId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = [];

      for (const entry of itemsWithPrescription) {
        const item = entry.item;
        let prescriptionId: string | undefined;

        if (
          item.prescription &&
          (item.prescription.odSph !== undefined || item.prescription.lensUsage)
        ) {
          let rxUrl = item.prescription.rxFileUrl || null;
          let rxPublicId = null;

          if (rxUrl && rxUrl.startsWith("data:image/")) {
            try {
              const uploadRes = await uploadToCloudinary(rxUrl, "myeyes_prescriptions");
              rxUrl = uploadRes.secure_url;
              rxPublicId = uploadRes.public_id;
            } catch (err) {
              console.error("Prescription upload to Cloudinary failed:", err);
            }
          }

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
              fileUrl: rxUrl,
              prescription_url: rxUrl,
              prescription_public_id: rxPublicId,
            },
          });
          prescriptionId = rxRecord.id;
        }

        orderItemsData.push({
          productId: item.productId,
          prescriptionId: prescriptionId || null,
          price: parseFloat(String(item.price)) || 0,
          quantity: item.quantity || 1,
          framePrice: item.prescription?.framePrice || null,
          lensBasePriceKey: item.prescription?.lensBasePriceKey || null,
          lensBasePriceValue: item.prescription?.lensBasePriceValue || null,
          lensMultiplier: item.prescription?.lensMultiplier || null,
          lensFinalPrice: item.prescription?.lensFinalPrice || null,
          isAsymmetricRx: item.prescription?.isAsymmetricRx || false,
          rightEyeLensPrice: item.prescription?.rightEyeLensPrice || null,
          leftEyeLensPrice: item.prescription?.leftEyeLensPrice || null,
          rightMultiplier: item.prescription?.rightMultiplier || null,
          leftMultiplier: item.prescription?.leftMultiplier || null,
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

    // CRM Lead Deduplication Algorithm
    const normalizedPhone = normalizePhoneNumber(customerPhone);
    if (normalizedPhone || customerName) {
      try {
        const allUnconvertedLeads = await prisma.lead.findMany({
          where: { status: { notIn: ["CONVERTED", "converted"] } },
        });

        const matchingLeadIds = allUnconvertedLeads
          .filter((l) => {
            const leadPhoneNorm = normalizePhoneNumber(l.whatsapp);
            const isPhoneMatch = normalizedPhone && leadPhoneNorm && (
              normalizedPhone === leadPhoneNorm ||
              normalizedPhone.endsWith(leadPhoneNorm.slice(-10)) ||
              leadPhoneNorm.endsWith(normalizedPhone.slice(-10))
            );
            const isNameMatch = customerName && l.name &&
              l.name.trim().toLowerCase() === customerName.trim().toLowerCase();
            return isPhoneMatch || isNameMatch;
          })
          .map((l) => l.id);

        if (matchingLeadIds.length > 0) {
          await prisma.lead.deleteMany({
            where: { id: { in: matchingLeadIds } },
          });
          console.log(`[Lead Deduplication] Automatically deleted ${matchingLeadIds.length} matching lead(s) for Order #${order.orderNumber}`);
        }
      } catch (leadErr) {
        console.error("Lead deduplication auto-delete failed:", leadErr);
      }
    }

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
