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
import LensConfiguratorModal from "@/components/configurator/LensConfiguratorModal";
import ProductDrawer from "@/components/ProductDrawer";
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
  const [drawerProduct, setDrawerProduct] = useState<SafeProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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


  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 pb-16">
        {/* Page Header with balanced breathing room */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 mb-8 gap-6">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold tracking-widest text-amber-700 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
              {categoryTag}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Mobile Filter Drawer Trigger + Quiz link */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <MobileFilterDrawer facets={facets} totalResults={filteredProducts.length} />
            <Link
              href="/quiz"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Style Quiz</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Split: Sticky Filter Sidebar (Desktop) + Product Grid with clean gap spacing */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterSidebar facets={facets} totalProducts={filteredProducts.length} />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full">
            {/* Active Filter Chips & Sort Selector */}
            <ActiveFilterRibbon totalResults={filteredProducts.length} />

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200 p-8 my-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <EyeOff className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  {initialProducts.length === 0
                    ? "No products currently available"
                    : "No matching frames found"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  {initialProducts.length === 0
                    ? "New prescription frames are being added regularly. Please check back shortly or explore our other collections."
                    : "We could not find any frames matching your exact combination of active filters. Try broadening your criteria or reset all filters."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {initialProducts.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  ) : (
                    <Link
                      href="/collections"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <span>Browse All Collections</span>
                    </Link>
                  )}
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
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCardClick={(p) => {
                      setDrawerProduct(p as SafeProduct);
                      setDrawerOpen(true);
                    }}
                    onAddLenses={handleAddLenses}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Slide-over Product Detail Drawer */}
      <ProductDrawer
        isOpen={drawerOpen}
        product={drawerProduct}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerProduct(null);
        }}
        onAddLenses={handleAddLenses}
        onAddToCart={handleAddToCart}
      />

      {/* 4-Step Lens Configurator */}
      {selectedProduct && (
        <LensConfiguratorModal
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
          frame={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            imageUrl: (Array.isArray(selectedProduct.images)
              ? selectedProduct.images[0]
              : selectedProduct.images) || '/placeholder-frame.png',
          }}
        />
      )}
    </div>
  );
}
