"use client";

import { useEffect, useState } from "react";
import { Glasses, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";
import ProductCard from "@/components/products/ProductCard";

const CATEGORIES = ["All", "EYEGLASSES", "SUNGLASSES"];
const FRAME_SHAPES = ["All", "ROUND", "AVIATOR", "SQUARE", "CAT_EYE", "RECTANGLE"];
const MATERIALS = ["All", "ACETATE", "TITANIUM", "STAINLESS_STEEL", "WOOD"];

export default function WomenCollectionPage() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterShape, setFilterShape] = useState("All");
  const [filterMaterial, setFilterMaterial] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    try {
      fetch("/api/admin/products")
        .then((res) => res.json())
        .then((data) => {
          setProducts(safeProductList(data));
          setLoading(false);
        })
        .catch(() => {
          setProducts([]);
          setLoading(false);
        });
    } catch {
      setProducts([]);
      setLoading(false);
    }
  }, []);

  const filtered = products.filter((p) => {
    // Only Women and Unisex
    const genderMatch = p.gender.toLowerCase() === "women" || p.gender.toLowerCase() === "unisex";
    if (!genderMatch) return false;

    if (filterCategory !== "All" && p.category !== filterCategory) return false;
    if (filterShape !== "All" && p.frameShape !== filterShape) return false;
    if (filterMaterial !== "All" && p.material !== filterMaterial) return false;
    return true;
  });

  const handleRxSubmit = (details: PrescriptionDetails, totalPrice: number) => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      name: `${selectedProduct.name} (${details.lensUsage})`,
      price: totalPrice,
      image: selectedProduct.images[0] || "",
      prescription: details,
    });
  };

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
              WOMEN&apos;S COUTURE
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Women&apos;s Eyewear Collection
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Sculpted cat-eyes, sleek geometric contours, and premium acetate frames equipped with precision prescription and sun lenses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(filterCategory !== "All" || filterShape !== "All" || filterMaterial !== "All") && (
              <button
                onClick={() => {
                  setFilterCategory("All");
                  setFilterShape("All");
                  setFilterMaterial("All");
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Drawer */}
        {showFilters && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 mb-8 space-y-4 animate-fade-in-up">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Product Category
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      filterCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {cat === "All" ? "All Collections" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Frame Shape
              </span>
              <div className="flex flex-wrap gap-2">
                {FRAME_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setFilterShape(shape)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      filterShape === shape
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {shape === "All" ? "All Shapes" : shape.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Material
              </span>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setFilterMaterial(mat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      filterMaterial === mat
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {mat === "All" ? "All Materials" : mat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white animate-pulse flex flex-col justify-between overflow-hidden">
                <div className="w-full aspect-[4/3] sm:aspect-[16/11] bg-slate-100" />
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Glasses className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              No products found in Women&apos;s Collection.
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Use the admin portal to manage catalog items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddLenses={(p) => {
                  setSelectedProduct(p as unknown as SafeProduct);
                  setRxModalOpen(true);
                }}
                onAddToCart={(p) => {
                  addItem({
                    productId: p.id,
                    name: `${p.name} (Standard Sun Lenses)`,
                    price: p.price,
                    image: p.images[0] || "",
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {selectedProduct && (
        <PrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price}
          onSubmit={handleRxSubmit}
        />
      )}
    </div>
  );
}
