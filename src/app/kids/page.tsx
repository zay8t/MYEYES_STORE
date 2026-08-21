"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import LogoLoader from "@/components/ui/LogoLoader";

function KidsCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?gender=Kids", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = safeProductList(data);
        const kidsList = list.filter(
          (p) => (p.gender || "").toLowerCase() === "kids" || (p.gender || "").toLowerCase() === "juniors"
        );
        setProducts(kidsList.length > 0 ? kidsList : list);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LogoLoader text="LOADING KIDS' COLLECTION..." />;
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="Kids & Juniors Eyewear Collection"
      subtitle="Ultra-flexible, shatter-resistant TR90 and rubberized memory polymer frames crafted for active youth with scratch-resistant lenses."
      categoryTag="Kids & Youth Collection"
      categoryDefault="ALL"
    />
  );
}

export default function KidsCollectionPage() {
  return (
    <Suspense fallback={<LogoLoader text="LOADING KIDS' COLLECTION..." />}>
      <KidsCatalogContent />
    </Suspense>
  );
}
