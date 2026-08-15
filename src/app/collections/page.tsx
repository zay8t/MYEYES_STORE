"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import { Loader2 } from "lucide-react";

function CollectionsCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
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
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900 mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading All Collections...
        </p>
      </div>
    );
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900 mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Catalog...
          </p>
        </div>
      }
    >
      <CollectionsCatalogContent />
    </Suspense>
  );
}
