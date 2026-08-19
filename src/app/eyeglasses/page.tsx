"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import LogoLoader from "@/components/ui/LogoLoader";

function EyeglassesCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products?category=EYEGLASSES", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setProducts(safeProductList(data));
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LogoLoader text="LOADING EYEGLASSES COLLECTION..." />;
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="Prescription Optical Eyeglasses"
      subtitle="Precision engineered frames paired with crystal clear custom optical lenses, blue light screen defense, and lightweight progressive corridors."
      categoryTag="Optical Collection"
      categoryDefault="EYEGLASSES"
    />
  );
}

export default function EyeglassesCatalog() {
  return (
    <Suspense fallback={<LogoLoader text="LOADING EYEGLASSES COLLECTION..." />}>
      <EyeglassesCatalogContent />
    </Suspense>
  );
}
