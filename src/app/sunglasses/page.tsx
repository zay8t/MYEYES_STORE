"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import LogoLoader from "@/components/ui/LogoLoader";

function SunglassesCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?category=SUNGLASSES", { cache: "no-store" })
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
    return <LogoLoader text="LOADING SUNGLASSES COLLECTION..." />;
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="Designer Sun & Lifestyle Eyewear"
      subtitle="Full UV400 polarized and gradient tinted frames crafted from handcrafted acetate and aerospace titanium for sunny leisure and driving."
      categoryTag="Sunwear Collection"
      categoryDefault="SUNGLASSES"
    />
  );
}

export default function SunglassesCatalog() {
  return (
    <Suspense fallback={<LogoLoader text="LOADING SUNGLASSES COLLECTION..." />}>
      <SunglassesCatalogContent />
    </Suspense>
  );
}
