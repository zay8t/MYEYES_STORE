import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerOrderTrackingView, { CustomerOrderData } from "@/components/customer/CustomerOrderTrackingView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return {
    title: `Order #${orderNumber} Confirmed | My Eyes`,
    description: `Track live payment and fulfillment status for Order #${orderNumber}.`,
  };
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const cleanId = decodeURIComponent(orderNumber).trim();

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: cleanId },
        { id: cleanId },
        { orderNumber: { equals: cleanId, mode: "insensitive" } },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              images: true,
            },
          },
          prescription: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const customerOrderData: CustomerOrderData = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingFee: order.shippingFee,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    transactionId: order.transactionId,
    paymentReceiptUrl: order.paymentReceiptUrl,
    paymentSenderName: order.paymentSenderName,
    paymentSenderPhone: order.paymentSenderPhone,
    verifiedAt: order.verifiedAt?.toISOString() ?? null,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
      framePrice: item.framePrice,
      lensPackageName: item.lensPackageName || item.selectedLensName || item.prescription?.lensType || null,
      lensPrice: item.lensPrice ?? item.lensFinalPrice ?? null,
      lensFinalPrice: item.lensFinalPrice,
      selectedLensName: item.selectedLensName,
      totalAmount: item.totalAmount,
      product: {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        images: item.product.images,
      },
      prescription: item.prescription
        ? {
            id: item.prescription.id,
            lensType: item.prescription.lensType,
            odSph: item.prescription.odSph,
            odCyl: item.prescription.odCyl,
            odAxis: item.prescription.odAxis,
            osSph: item.prescription.osSph,
            osCyl: item.prescription.osCyl,
            osAxis: item.prescription.osAxis,
            pd: item.prescription.pd,
            fileUrl: item.prescription.fileUrl,
          }
        : null,
    })),
  };

  return <CustomerOrderTrackingView initialOrder={customerOrderData} isSuccessView={true} />;
}
