import React from "react";
import { prisma } from "@/lib/prisma";
import OrdersPipelineClient from "@/components/admin/OrdersPipelineClient";
import { OrderReceiptData } from "@/components/A4ReceiptModal";

export const revalidate = 0; // Fresh data on request

export default async function AdminOrdersPage() {
  const rawOrders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          prescription: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders: OrderReceiptData[] = rawOrders.map((ord) => ({
    ...ord,
    status: ord.status as OrderReceiptData["status"],
    createdAt: ord.createdAt.toISOString(),
    updatedAt: ord.updatedAt.toISOString(),
    items: ord.items.map((item) => ({
      ...item,
      prescription: item.prescription
        ? {
            ...item.prescription,
            createdAt: item.prescription.createdAt.toISOString(),
          }
        : null,
    })),
  }));

  return <OrdersPipelineClient initialOrders={orders} />;
}
