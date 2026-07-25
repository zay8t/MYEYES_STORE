"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Glasses, SlidersHorizontal, ArrowRight, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  frameShape: string;
  material: string;
  gender: string;
  images: string;
  featured: boolean;
  category: string;
}

const FRAME_SHAPES = ["All", "ROUND", "AVIATOR", "SQUARE", "CAT_EYE", "RECTANGLE"];
const MATERIALS = ["All", "ACETATE", "TITANIUM", "STAINLESS_STEEL", "WOOD"];

export default function EyeglassesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShape, setFilterShape] = useState("All");
  const [filterMaterial, setFilterMaterial] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/admin/products?category=EYEGLASSES")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  const parseImages = (imagesStr: string): string[] => {
    if (!imagesStr) return [];
    try {
      if (imagesStr.startsWith("[")) {
        return JSON.parse(imagesStr);
      }
      return imagesStr.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [imagesStr];
    }
  };

  const filtered = products.filter((p) => {
    if (filterShape !== "All" && p.frameShape !== filterShape) return false;
    if (filterMaterial !== "All" && p.material !== filterMaterial) return false;
    return true;
  });

  const handleRxSubmit = (details: PrescriptionDetails, totalPrice: number) => {
    if (!selectedProduct) return;
    const imagesList = parseImages(selectedProduct.images);
    addItem({
      productId: selectedProduct.id,
      name: `${selectedProduct.name} (${details.lensUsage})`,
      price: totalPrice,
      image: imagesList[0] || "",
      prescription: details,
    });
  };

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              OPTICAL COLLECTION
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Prescription Eyeglasses
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Precision optical frames engineered with ultra-light materials for weightless daily wear.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(filterShape !== "All" || filterMaterial !== "All") && (
              <button
                onClick={() => {
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

        {/* Product Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-4 animate-pulse space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State as specified: "No frames published yet. Add your inventory in the Admin Portal." */
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Glasses className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              No frames published yet. Add your inventory in the Admin Portal.
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Use the admin portal to manage catalog items for the Eyeglasses tab.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Open Admin Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product) => {
              const imagesList = parseImages(product.images);
              const mainImg = imagesList[0] || "";

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:border-slate-400 transition-all duration-200 flex flex-col justify-between"
                >
                  <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] bg-slate-50 p-6 overflow-hidden">
                    {mainImg ? (
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Glasses className="w-16 h-16 stroke-[1.25]" />
                      </div>
                    )}
                  </Link>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                        <span>{product.frameShape.replace("_", " ")}</span>
                        <span>{product.material.replace("_", " ")}</span>
                      </div>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-base font-bold text-slate-900 group-hover:underline">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatPrice(product.price)}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setRxModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Add Lenses
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
