"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sun, SlidersHorizontal, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import ProductCard from "@/components/products/ProductCard";

const LENS_TINTS = ["All", "Dark Gray", "Amber", "Mirror", "Polarized"];
const FRAME_SHAPES = ["All", "ROUND", "AVIATOR", "SQUARE", "CAT_EYE", "RECTANGLE"];

function SunglassesCatalog() {
  const searchParams = useSearchParams();
  const genderParam = searchParams.get("gender") || "All";

  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTint, setFilterTint] = useState("All");
  const [filterShape, setFilterShape] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    try {
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
    } catch {
      setProducts([]);
      setLoading(false);
    }
  }, []);

  const filtered = products.filter((p) => {
    if (filterShape !== "All" && p.frameShape !== filterShape) return false;
    if (genderParam !== "All" && p.gender.toLowerCase() !== genderParam.toLowerCase()) return false;
    return true;
  });

  const getHeaderTitle = () => {
    if (genderParam === "Men") return "Men's Designer Sunglasses";
    if (genderParam === "Women") return "Women's Designer Sunglasses";
    if (genderParam === "Kids") return "Kids' Designer Sunglasses";
    return "Designer Sunglasses";
  };

  const getHeaderDesc = () => {
    if (genderParam === "Men") return "100% UV400 protection with precision polarized & tinted sun optics for men.";
    if (genderParam === "Women") return "100% UV400 protection with precision polarized & tinted sun optics for women.";
    if (genderParam === "Kids") return "100% UV400 protection with precision polarized & tinted sun optics for kids.";
    return "100% UV400 protection with precision polarized & tinted sun optics.";
  };



  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              SUN COLLECTION
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {getHeaderTitle()}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              {getHeaderDesc()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(filterTint !== "All" || filterShape !== "All") && (
              <button
                onClick={() => {
                  setFilterTint("All");
                  setFilterShape("All");
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
                Sun Lens Tint
              </span>
              <div className="flex flex-wrap gap-2">
                {LENS_TINTS.map((tint) => (
                  <button
                    key={tint}
                    onClick={() => setFilterTint(tint)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      filterTint === tint
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {tint === "All" ? "All Tints" : tint}
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
            <Sun className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              No frames published yet. Add your inventory in the Admin Portal.
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Use the admin portal to manage catalog items for the Sunglasses tab.
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
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddLenses={() => {
                  // Sunglasses do not have prescription lenses modal unless customized
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


    </div>
  );
}

export default function SunglassesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-medium text-slate-500">Loading catalog...</div>}>
      <SunglassesCatalog />
    </Suspense>
  );
}
