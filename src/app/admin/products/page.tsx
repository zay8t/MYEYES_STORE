import React from "react";
import { prisma } from "@/lib/prisma";
import ProductsCatalogClient from "@/components/admin/ProductsCatalogClient";

export const revalidate = 0; // Fresh data per request

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <ProductsCatalogClient initialProducts={products} />;
}
