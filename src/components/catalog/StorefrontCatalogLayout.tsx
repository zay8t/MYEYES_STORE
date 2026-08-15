"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SafeProduct } from "@/lib/data-guards";
import { useCatalogFilters } from "@/lib/hooks/useCatalogFilters";
import { aggregateFacets, filterAndSortProducts } from "@/lib/catalog/facetAggregator";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import MobileFilterDrawer from "@/components/catalog/MobileFilterDrawer";
import ActiveFilterRibbon from "@/components/catalog/ActiveFilterRibbon";
import ProductCard, { Product } from "@/components/products/ProductCard";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";
import { useCartStore } from "@/lib/cart-store";
import { Sparkles, RotateCcw, EyeOff } from "lucide-react";

interface StorefrontCatalogLayoutProps {
  initialProducts: SafeProduct[];
  title: string;
  subtitle: string;
  categoryTag: string;
  categoryDefault?: "EYEGLASSES" | "SUNGLASSES" | "ALL";
}

export default function StorefrontCatalogLayout({
  initialProducts,
  title,
  subtitle,
  categoryTag,
}: StorefrontCatalogLayoutProps) {
  const { filters, resetFilters } = useCatalogFilters();
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  // Real-time facet aggregation
  const facets = useMemo(() => {
    return aggregateFacets(initialProducts, filters);
  }, [initialProducts, filters]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(initialProducts, filters);
  }, [initialProducts, filters]);

  const handleAddLenses = (product: SafeProduct | Product) => {
    setSelectedProduct(product as SafeProduct);
    setRxModalOpen(true);
  };

  const handleAddToCart = (product: SafeProduct | Product) => {
    const img = Array.isArray(product.images)
      ? product.images[0]
      : typeof product.images === "string"
      ? product.images
      : "";
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: img || "",
    });
  };

  const handleRxSubmit = (details: PrescriptionDetails, totalPrice: number) => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      name: `${selectedProduct.name} (${details.lensUsage})`,
      price: totalPrice,
      image: selectedProduct.images[0] || "",
      prescription: details,
    });
    setRxModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-slate-500">
                {categoryTag}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Mobile Filter Drawer Trigger + Quiz link */}
          <div className="flex items-center gap-3">
            <MobileFilterDrawer facets={facets} totalResults={filteredProducts.length} />
            <Link
              href="/quiz"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Style Quiz</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Split: Sticky Filter Sidebar (Desktop) + Product Grid */}
        <div className="flex items-start">
          {/* Desktop Collapsible Rail */}
          <div className="hidden lg:block">
            <FilterSidebar facets={facets} totalProducts={filteredProducts.length} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Active Filter Chips & Sort Selector */}
            <ActiveFilterRibbon totalResults={filteredProducts.length} />

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200 p-8 my-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <EyeOff className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  No matching frames found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  We could not find any frames matching your exact combination of active filters. Try broadening your criteria or reset all filters.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Take Style Quiz</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddLenses={handleAddLenses}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Customization Modal */}
      {selectedProduct && (
        <PrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => setRxModalOpen(false)}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price}
          productId={selectedProduct.id}
          onSubmit={handleRxSubmit}
        />
      )}
    </div>
  );
}
