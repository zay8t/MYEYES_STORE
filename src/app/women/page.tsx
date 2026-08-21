"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import LogoLoader from "@/components/ui/LogoLoader";

function WomenCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?gender=Women", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = safeProductList(data);
        const womenList = list.filter(
          (p) => (p.gender || "").toLowerCase() === "women" || (p.gender || "").toLowerCase() === "unisex"
        );
        setProducts(womenList.length > 0 ? womenList : list);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LogoLoader text="LOADING WOMEN'S COLLECTION..." />;
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="Women's Designer Eyewear Collection"
      subtitle="Elevated cat-eye, round, crystal clear, and rose gold silhouettes engineered with featherlight frames and bespoke prescription optics."
      categoryTag="Women's Collection"
      categoryDefault="ALL"
    />
  );
}

export default function WomenCollectionPage() {
  return (
    <Suspense fallback={<LogoLoader text="LOADING WOMEN'S COLLECTION..." />}>
      <WomenCatalogContent />
    </Suspense>
  );
}
