import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { generateNextOrderNumber } from "@/lib/order-number";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { verifyRecaptchaToken } from "@/lib/recaptcha-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;


interface PrescriptionInput {
  lensUsage?: string;
  lensMaterial?: string;
  visionType?: string;
  lensPackageName?: string;
  lensPrice?: number | null;
  frameName?: string;
  framePrice?: number | null;
  odSph?: string | number;
  odCyl?: string | number | null;
  odAxis?: string | number | null;
  osSph?: string | number;
  osCyl?: string | number | null;
  osAxis?: string | number | null;
  pd?: string | number;
  rxFileUrl?: string | null;
  selectedLensName?: string;
  lensBasePriceKey?: string | null;
  lensBasePriceValue?: number | null;
  lensMultiplier?: number | null;
  lensFinalPrice?: number | null;
  isAsymmetricRx?: boolean;
  rightEyeLensPrice?: number | null;
  leftEyeLensPrice?: number | null;
  rightMultiplier?: number | null;
  leftMultiplier?: number | null;
}

interface OrderItemInput {
  productId: string;
  price: string | number;
  quantity?: number;
  frameName?: string;
  framePrice?: string | number | null;
  visionType?: string;
  lensPackageName?: string;
  lensPrice?: string | number | null;
  unitPrice?: string | number;
  totalPrice?: string | number;
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
      paymentReceiptUrl,
      transactionProofUrl,
      transactionId,
      paymentSenderName,
      paymentSenderPhone,
      items,
      token,
      recaptchaToken,
    } = body;

    const verificationToken = token || recaptchaToken;
    if (!verificationToken) {
      return NextResponse.json(
        { error: "reCAPTCHA token is required." },
        { status: 400 }
      );
    }

    const recaptchaResult = await verifyRecaptchaToken(verificationToken, "checkout");
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || "Automated activity detected. Order rejected." },
        { status: recaptchaResult.isBot ? 403 : 400 }
      );
    }

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

    let parsedMethod: PaymentMethod = PaymentMethod.BANK_TRANSFER;
    if (paymentMethod === "COD") {
      parsedMethod = PaymentMethod.COD;
    } else if (paymentMethod === "EASYPAISA") {
      parsedMethod = PaymentMethod.EASYPAISA;
    } else if (paymentMethod === "JAZZCASH") {
      parsedMethod = PaymentMethod.JAZZCASH;
    } else if (paymentMethod === "RAAST") {
      parsedMethod = PaymentMethod.RAAST;
    } else if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "ALFALAH") {
      parsedMethod = PaymentMethod.BANK_TRANSFER;
    }

    const finalReceiptUrl = paymentReceiptUrl || transactionProofUrl || null;
    const finalPaymentStatus: PaymentStatus =
      parsedMethod === PaymentMethod.COD
        ? PaymentStatus.UNPAID
        : PaymentStatus.PENDING_VERIFICATION;

    if (parsedMethod !== PaymentMethod.COD && !finalReceiptUrl) {
      return NextResponse.json(
        { error: "Payment verification receipt screenshot is required for online prepaid payments." },
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
                item.lensPackageName ||
                item.prescription.lensPackageName ||
                item.prescription.visionType ||
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

        const itemFramePrice = item.framePrice !== undefined && item.framePrice !== null
          ? parseFloat(String(item.framePrice))
          : (item.prescription?.framePrice !== undefined && item.prescription?.framePrice !== null
              ? parseFloat(String(item.prescription.framePrice))
              : (item.prescription ? null : parseFloat(String(item.price)) || null));

        const itemLensPackageName = item.lensPackageName ||
          item.prescription?.lensPackageName ||
          item.prescription?.selectedLensName ||
          item.prescription?.lensMaterial ||
          item.prescription?.lensUsage ||
          (item.prescription ? "Standard Prescription Lenses" : null);

        const itemLensPrice = item.lensPrice !== undefined && item.lensPrice !== null
          ? parseFloat(String(item.lensPrice))
          : (item.prescription?.lensPrice !== undefined && item.prescription?.lensPrice !== null
              ? parseFloat(String(item.prescription.lensPrice))
              : (item.prescription?.lensFinalPrice !== undefined && item.prescription?.lensFinalPrice !== null
                  ? parseFloat(String(item.prescription.lensFinalPrice))
                  : null));

        orderItemsData.push({
          productId: item.productId,
          prescriptionId: prescriptionId || null,
          price: parseFloat(String(item.price)) || 0,
          quantity: item.quantity || 1,
          framePrice: itemFramePrice,
          lensPackageName: itemLensPackageName,
          lensPrice: itemLensPrice,
          lensBasePriceKey: item.prescription?.lensBasePriceKey || null,
          lensBasePriceValue: item.prescription?.lensBasePriceValue || null,
          lensMultiplier: item.prescription?.lensMultiplier || null,
          lensFinalPrice: itemLensPrice ?? item.prescription?.lensFinalPrice ?? null,
          isAsymmetricRx: item.prescription?.isAsymmetricRx || false,
          rightEyeLensPrice: item.prescription?.rightEyeLensPrice || null,
          leftEyeLensPrice: item.prescription?.leftEyeLensPrice || null,
          rightMultiplier: item.prescription?.rightMultiplier || null,
          leftMultiplier: item.prescription?.leftMultiplier || null,
          selectedLensName: itemLensPackageName,
          calculatedLensPrice: itemLensPrice,
          totalAmount: ((itemFramePrice || 0) + (itemLensPrice || 0)) > 0
            ? ((itemFramePrice || 0) + (itemLensPrice || 0)) * (item.quantity || 1)
            : (parseFloat(String(item.price)) || 0) * (item.quantity || 1),
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
          paymentMethod: parsedMethod,
          paymentStatus: finalPaymentStatus,
          paymentReceiptUrl: finalReceiptUrl,
          transactionProofUrl: finalReceiptUrl,
          transactionId: transactionId ? String(transactionId).trim().toUpperCase() : null,
          paymentSenderName: paymentSenderName || null,
          paymentSenderPhone: paymentSenderPhone || null,
          shippingFee,
          totalAmount,
          status: OrderStatus.PROCESSING,
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

    // Write initial payment audit log entry
    if (order.paymentReceiptUrl) {
      try {
        await prisma.paymentAuditLog.create({
          data: {
            orderId: order.id,
            action: "SUBMITTED",
            actor: "CUSTOMER",
            notes: `Payment receipt submitted via ${paymentMethod}. TID: ${order.transactionId || "not provided"}. Sender: ${order.paymentSenderName || "not provided"}.`,
          },
        });
      } catch (auditErr) {
        console.error("Audit log write failed (non-fatal):", auditErr);
      }
    }

    // CRM Lead Deduplication & Conversion Algorithm
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
          await prisma.lead.updateMany({
            where: { id: { in: matchingLeadIds } },
            data: { status: "CONVERTED", updatedAt: new Date() },
          });
          console.log(`[Lead Conversion] Successfully converted ${matchingLeadIds.length} lead(s) for Order #${order.orderNumber}`);
        }
      } catch (leadErr) {
        console.error("Lead conversion update failed:", leadErr);
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
