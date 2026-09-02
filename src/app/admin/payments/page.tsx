import React from "react";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import PaymentVerificationClient, { PaymentOrder } from "@/components/admin/PaymentVerificationClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Approve Advance Deposits | My Eyes Admin",
  description: "Verify customer bank transfer, EasyPaisa, and JazzCash receipts for My Eyes Eyewear.",
};

export default async function AdminPaymentsPage() {
  let orders: PaymentOrder[] = [];

  try {
    const raw = await prisma.order.findMany({
      where: {
        OR: [
          {
            paymentMethod: {
              in: [
                PaymentMethod.BANK_TRANSFER,
                PaymentMethod.EASYPAISA,
                PaymentMethod.JAZZCASH,
                PaymentMethod.RAAST,
              ],
            },
          },
          { paymentStatus: { in: [PaymentStatus.PENDING_VERIFICATION, PaymentStatus.PAID, PaymentStatus.FAILED] } },
          { paymentReceiptUrl: { not: null } },
          { transactionProofUrl: { not: null } },
          { transactionId: { not: null } },
        ],
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, category: true } },
            prescription: {
              select: {
                lensType: true,
                odSph: true,
                osSph: true,
                odCyl: true,
                osCyl: true,
                odAxis: true,
                osAxis: true,
                pd: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "asc" },
          select: { id: true, action: true, actor: true, notes: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    orders = raw.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      customerEmail: ord.customerEmail,
      customerPhone: ord.customerPhone,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      paymentReceiptUrl: ord.paymentReceiptUrl,
      transactionId: ord.transactionId,
      paymentSenderName: ord.paymentSenderName,
      paymentSenderPhone: ord.paymentSenderPhone,
      ocrExtractedTid: ord.ocrExtractedTid,
      ocrConfidenceScore: ord.ocrConfidenceScore,
      isOcrMatched: ord.isOcrMatched,
      flaggedSuspicious: ord.flaggedSuspicious,
      verifiedBy: ord.verifiedBy,
      verifiedAt: ord.verifiedAt?.toISOString() ?? null,
      rejectionReason: ord.rejectionReason,
      customerNotified: ord.customerNotified,
      totalAmount: ord.totalAmount,
      createdAt: ord.createdAt.toISOString(),
      items: ord.items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        selectedLensName: item.selectedLensName,
        totalAmount: item.totalAmount,
        product: { name: item.product.name, category: item.product.category },
        prescription: item.prescription
          ? {
              lensType: item.prescription.lensType,
              odSph: item.prescription.odSph,
              osSph: item.prescription.osSph,
              odCyl: item.prescription.odCyl,
              osCyl: item.prescription.osCyl,
              odAxis: item.prescription.odAxis,
              osAxis: item.prescription.osAxis,
              pd: item.prescription.pd,
            }
          : null,
      })),
      auditLogs: ord.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actor: log.actor,
        notes: log.notes,
        createdAt: log.createdAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.error("Admin payments page error:", error);
  }

  return <PaymentVerificationClient initialOrders={orders} />;
}
