"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import { Loader2 } from "lucide-react";

function SunglassesCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products?category=SUNGLASSES")
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
          Loading Sunglasses Catalog...
        </p>
      </div>
    );
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
      <SunglassesCatalogContent />
    </Suspense>
  );
}
