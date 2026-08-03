import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminSingleOrderClient from "@/components/admin/AdminSingleOrderClient";

export const revalidate = 0;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rawOrder = await prisma.order.findFirst({
    where: {
      OR: [{ id: id }, { orderNumber: id }],
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

  if (!rawOrder) {
    notFound();
  }

  const order = {
    ...rawOrder,
    shippingFee: rawOrder.shippingFee ?? undefined,
    status: rawOrder.status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED",
    createdAt: rawOrder.createdAt.toISOString(),
    updatedAt: rawOrder.updatedAt.toISOString(),
    items: rawOrder.items.map((item) => ({
      ...item,
      prescription: item.prescription
        ? {
            ...item.prescription,
            createdAt: item.prescription.createdAt.toISOString(),
          }
        : null,
    })),
  };

  return <AdminSingleOrderClient order={order} />;
}
