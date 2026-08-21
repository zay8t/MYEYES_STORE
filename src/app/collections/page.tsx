"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import LogoLoader from "@/components/ui/LogoLoader";

function CollectionsCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
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
    return <LogoLoader text="CURATING EYEWEAR..." />;
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="All Eyewear Collections"
      subtitle="Explore our complete line of optical eyeglasses, designer sunglasses, and premium prescription eyewear with multi-faceted filtering."
      categoryTag="Complete Catalog"
      categoryDefault="ALL"
    />
  );
}

export default function CollectionsCatalog() {
  return (
    <Suspense fallback={<LogoLoader text="CURATING EYEWEAR..." />}>
      <CollectionsCatalogContent />
    </Suspense>
  );
}
