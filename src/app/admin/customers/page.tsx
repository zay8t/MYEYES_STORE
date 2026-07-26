import React from "react";
import { prisma } from "@/lib/prisma";
import CustomersCRMClient, { CustomerData } from "@/components/admin/CustomersCRMClient";
import { OrderReceiptData } from "@/components/A4ReceiptModal";

export const revalidate = 0; // Fresh data per request

export default async function AdminCustomersPage() {
  const orders = await prisma.order.findMany({
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

  // Group orders by customer email to compile customer CRM profiles
  const customerMap: Record<string, CustomerData> = {};

  orders.forEach((ord) => {
    const email = ord.customerEmail.toLowerCase().trim();
    if (!customerMap[email]) {
      customerMap[email] = {
        email,
        name: ord.customerName,
        phone: ord.customerPhone || "",
        address: [ord.shippingAddress, ord.shippingCity].filter(Boolean).join(", "),
        totalSpent: 0,
        ordersCount: 0,
        lastOrderDate: ord.createdAt.toISOString(),
        orders: [],
      };
    }

    const serializedOrder: OrderReceiptData = {
      ...ord,
      shippingFee: ord.shippingFee ?? undefined,
      status: ord.status as OrderReceiptData["status"],
      createdAt: ord.createdAt.toISOString(),
      items: ord.items.map((item) => ({
        ...item,
        prescription: item.prescription
          ? {
              ...item.prescription,
              createdAt: item.prescription.createdAt.toISOString(),
            }
          : null,
      })),
    };

    customerMap[email].totalSpent += ord.totalAmount;
    customerMap[email].ordersCount += 1;
    customerMap[email].orders.push(serializedOrder);
  });

  const customersList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);

  return <CustomersCRMClient initialCustomers={customersList} />;
}
