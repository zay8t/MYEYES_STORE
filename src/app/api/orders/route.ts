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
  selectedLensName?: string;
  lensPrice?: number | string | null;
  frameName?: string;
  framePrice?: number | string | null;
  odSph?: string | number;
  odCyl?: string | number | null;
  odAxis?: string | number | null;
  osSph?: string | number;
  osCyl?: string | number | null;
  osAxis?: string | number | null;
  pd?: string | number;
  rxFileUrl?: string | null;
  lensBasePriceKey?: string | null;
  lensBasePriceValue?: number | string | null;
  lensMultiplier?: number | string | null;
  lensFinalPrice?: number | string | null;
  isAsymmetricRx?: boolean;
  rightEyeLensPrice?: number | string | null;
  leftEyeLensPrice?: number | string | null;
  rightMultiplier?: number | string | null;
  leftMultiplier?: number | string | null;
}

interface OrderItemInput {
  id?: string;
  cartItemId?: string;
  productId?: string;
  frameId?: string;
  name?: string;
  frameName?: string;
  price?: string | number;
  framePrice?: string | number | null;
  visionType?: string;
  lensPackageName?: string;
  selectedLensName?: string;
  lensPrice?: string | number | null;
  quantity?: number;
  unitPrice?: string | number;
  totalPrice?: string | number;
  prescription?: PrescriptionInput;
  [key: string]: any;
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
      const itemPrice = typeof item.price === "number" ? item.price : Number(item.price || 0);
      const itemQuantity = typeof item.quantity === "number" && item.quantity > 0 ? Math.floor(item.quantity) : 1;
      subtotal += itemPrice * itemQuantity;
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

        // Defensive field coercions and fallbacks
        const frameId = String(item.frameId || item.id || item.productId || "");
        const frameName = String(item.frameName || item.name || "Optical Frame");
        const framePrice = typeof item.framePrice === "number"
          ? item.framePrice
          : Number(item.framePrice || item.price || 0);
        const lensPackageName = String(
          item.lensPackageName ||
          item.selectedLensName ||
          item.prescription?.lensPackageName ||
          item.prescription?.selectedLensName ||
          (item.prescription ? "Standard Prescription Lenses" : "")
        );
        const lensPrice = typeof item.lensPrice === "number"
          ? item.lensPrice
          : Number(item.lensPrice || item.prescription?.lensPrice || 0);
        const productId = String(item.productId || frameId || "").trim();
        const quantity = typeof item.quantity === "number" && item.quantity > 0 ? Math.floor(item.quantity) : 1;
        const linePrice = typeof item.price === "number" ? item.price : Number(item.price || 0);

        if (
          item.prescription &&
          (item.prescription.odSph !== undefined || item.prescription.lensUsage || item.prescription.visionType)
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
                lensPackageName ||
                item.prescription.lensUsage ||
                item.prescription.lensMaterial ||
                item.prescription.visionType ||
                "Prescription Lenses",
              odSph: typeof item.prescription.odSph === "number"
                ? item.prescription.odSph
                : parseFloat(String(item.prescription.odSph)) || 0,
              odCyl:
                item.prescription.odCyl !== null && item.prescription.odCyl !== undefined && item.prescription.odCyl !== ""
                  ? (typeof item.prescription.odCyl === "number" ? item.prescription.odCyl : parseFloat(String(item.prescription.odCyl)) || null)
                  : null,
              odAxis:
                item.prescription.odAxis !== null && item.prescription.odAxis !== undefined && item.prescription.odAxis !== ""
                  ? (typeof item.prescription.odAxis === "number" ? Math.floor(item.prescription.odAxis) : parseInt(String(item.prescription.odAxis), 10) || null)
                  : null,
              osSph: typeof item.prescription.osSph === "number"
                ? item.prescription.osSph
                : parseFloat(String(item.prescription.osSph)) || 0,
              osCyl:
                item.prescription.osCyl !== null && item.prescription.osCyl !== undefined && item.prescription.osCyl !== ""
                  ? (typeof item.prescription.osCyl === "number" ? item.prescription.osCyl : parseFloat(String(item.prescription.osCyl)) || null)
                  : null,
              osAxis:
                item.prescription.osAxis !== null && item.prescription.osAxis !== undefined && item.prescription.osAxis !== ""
                  ? (typeof item.prescription.osAxis === "number" ? Math.floor(item.prescription.osAxis) : parseInt(String(item.prescription.osAxis), 10) || null)
                  : null,
              pd: typeof item.prescription.pd === "number"
                ? item.prescription.pd
                : parseFloat(String(item.prescription.pd)) || 63,
              fileUrl: rxUrl,
              prescription_url: rxUrl,
              prescription_public_id: rxPublicId,
            },
          });
          prescriptionId = rxRecord.id;
        }

        const calculatedItemTotal = ((framePrice || 0) + (lensPrice || 0)) > 0
          ? ((framePrice || 0) + (lensPrice || 0)) * quantity
          : linePrice * quantity;

        orderItemsData.push({
          productId,
          prescriptionId: prescriptionId || null,
          price: linePrice,
          quantity,
          framePrice,
          lensPackageName: lensPackageName || null,
          lensPrice,
          lensBasePriceKey: item.prescription?.lensBasePriceKey ? String(item.prescription.lensBasePriceKey) : null,
          lensBasePriceValue: typeof item.prescription?.lensBasePriceValue === "number"
            ? item.prescription.lensBasePriceValue
            : (item.prescription?.lensBasePriceValue ? Number(item.prescription.lensBasePriceValue) : null),
          lensMultiplier: typeof item.prescription?.lensMultiplier === "number"
            ? item.prescription.lensMultiplier
            : (item.prescription?.lensMultiplier ? Number(item.prescription.lensMultiplier) : null),
          lensFinalPrice: typeof item.prescription?.lensFinalPrice === "number"
            ? item.prescription.lensFinalPrice
            : (lensPrice ?? null),
          isAsymmetricRx: Boolean(item.prescription?.isAsymmetricRx),
          rightEyeLensPrice: typeof item.prescription?.rightEyeLensPrice === "number"
            ? item.prescription.rightEyeLensPrice
            : (item.prescription?.rightEyeLensPrice ? Number(item.prescription.rightEyeLensPrice) : null),
          leftEyeLensPrice: typeof item.prescription?.leftEyeLensPrice === "number"
            ? item.prescription.leftEyeLensPrice
            : (item.prescription?.leftEyeLensPrice ? Number(item.prescription.leftEyeLensPrice) : null),
          rightMultiplier: typeof item.prescription?.rightMultiplier === "number"
            ? item.prescription.rightMultiplier
            : (item.prescription?.rightMultiplier ? Number(item.prescription.rightMultiplier) : null),
          leftMultiplier: typeof item.prescription?.leftMultiplier === "number"
            ? item.prescription.leftMultiplier
            : (item.prescription?.leftMultiplier ? Number(item.prescription.leftMultiplier) : null),
          selectedLensName: item.selectedLensName ? String(item.selectedLensName) : (lensPackageName || null),
          calculatedLensPrice: lensPrice,
          totalAmount: calculatedItemTotal,
        });
      }

      const orderNumber = await generateNextOrderNumber(tx);

      return await tx.order.create({
        data: {
          orderNumber,
          customerName: String(customerName).trim(),
          customerEmail: String(customerEmail).trim().toLowerCase(),
          customerPhone: customerPhone ? String(customerPhone).trim() : null,
          shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
          shippingCity: shippingCity ? String(shippingCity).trim() : null,
          paymentMethod: parsedMethod,
          paymentStatus: finalPaymentStatus,
          paymentReceiptUrl: finalReceiptUrl,
          transactionProofUrl: finalReceiptUrl,
          transactionId: transactionId ? String(transactionId).trim().toUpperCase() : null,
          paymentSenderName: paymentSenderName ? String(paymentSenderName).trim() : null,
          paymentSenderPhone: paymentSenderPhone ? String(paymentSenderPhone).trim() : null,
          shippingFee,
          totalAmount,
          currency: "PKR",
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
  } catch (error: any) {
    console.error("Prisma Order Creation Detailed Error:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process and save customer order.",
        error: error.message || "Failed to process and save customer order.",
        code: error.code,
      },
      { status: 500 }
    );
  }
}
