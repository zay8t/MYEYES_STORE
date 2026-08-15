"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import { Loader2 } from "lucide-react";

function KidsCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        const list = safeProductList(data);
        const kidsList = list.filter(
          (p) => (p.gender || "").toLowerCase() === "kids" || (p.gender || "").toLowerCase() === "juniors"
        );
        // If kids collection is small, fallback to including unisex petite frames
        setProducts(kidsList.length > 0 ? kidsList : list);
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
          Loading Kids Collection...
        </p>
      </div>
    );
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
      <KidsCatalogContent />
    </Suspense>
  );
}
