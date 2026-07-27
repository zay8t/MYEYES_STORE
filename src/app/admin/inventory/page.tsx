import React from "react";
import { prisma } from "@/lib/prisma";
import { Product } from "@prisma/client";
import InventoryControlClient from "@/components/admin/InventoryControlClient";

export const revalidate = 0; // Fresh data per request

export default async function AdminInventoryPage() {
  let products: Product[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: { stock: "asc" }, // Show lowest stock items first!
    });
  } catch (error) {
    console.error("Inventory page database error:", error);
  }

  return <InventoryControlClient initialProducts={products} />;
}
