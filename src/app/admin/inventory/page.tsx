import React from "react";
import { prisma } from "@/lib/prisma";
import InventoryControlClient from "@/components/admin/InventoryControlClient";

export const revalidate = 0; // Fresh data per request

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" }, // Show lowest stock items first!
  });

  return <InventoryControlClient initialProducts={products} />;
}
