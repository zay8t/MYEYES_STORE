"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import { Loader2 } from "lucide-react";

function EyeglassesCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products?category=EYEGLASSES")
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
          Loading Eyeglasses Catalog...
        </p>
      </div>
    );
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
      <EyeglassesCatalogContent />
    </Suspense>
  );
}
