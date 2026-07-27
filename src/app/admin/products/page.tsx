import React from "react";
import { prisma } from "@/lib/prisma";
import { Product } from "@prisma/client";
import ProductsCatalogClient from "@/components/admin/ProductsCatalogClient";

export const revalidate = 0; // Fresh data per request

export default async function AdminProductsPage() {
  let products: Product[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Products page database error:", error);
  }

  return <ProductsCatalogClient initialProducts={products} />;
}
