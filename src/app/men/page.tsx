"use client";

import React, { useEffect, useState, Suspense } from "react";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import StorefrontCatalogLayout from "@/components/catalog/StorefrontCatalogLayout";
import { Loader2 } from "lucide-react";

function MenCatalogContent() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        const list = safeProductList(data);
        const menList = list.filter(
          (p) => (p.gender || "").toLowerCase() === "men" || (p.gender || "").toLowerCase() === "unisex"
        );
        setProducts(menList);
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
          Loading Men Collection...
        </p>
      </div>
    );
  }

  return (
    <StorefrontCatalogLayout
      initialProducts={products}
      title="Men's Designer Eyewear Collection"
      subtitle="Distinctive square, rectangle, aviator, and geometric frames engineered for masculine profiles in handcrafted Italian acetate and titanium."
      categoryTag="Men's Collection"
      categoryDefault="ALL"
    />
  );
}

export default function MenCollectionPage() {
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
      <MenCatalogContent />
    </Suspense>
  );
}
