"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Glasses, Sun, ArrowRight, Sparkles, Truck, ShieldCheck, CreditCard, Box } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { Hero3DViewer } from "@/components/3D/Frame3DCanvasWrapper";
import PrescriptionModal from "@/components/PrescriptionModal";
import LensVisualizer from "@/components/home/LensVisualizer";
import PrescriptionSteps from "@/components/home/PrescriptionSteps";
import CategorySpotlight from "@/components/home/CategorySpotlight";
import PakistanReviews from "@/components/home/PakistanReviews";

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                */}
      {/* ============================================================ */}
      <section className="relative pt-24 pb-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/5 border border-brand/20 text-[11px] font-bold uppercase tracking-widest text-brand-dark">
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
            Handcrafted Optical Studio
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Minimalist Eyewear.
            <br />
            <span className="text-brand font-semibold">Precision Vision Engine.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Discover lightweight Japanese titanium and bio-acetate frames designed for effortless daily style. Custom prescription fitting with anti-reflective optical clarity.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/eyeglasses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Glasses className="w-4 h-4" />
              Explore Eyeglasses
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/sunglasses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Explore Sunglasses
            </Link>
          </div>

          {/* Seamless 3D Model Hero Canvas */}
          <div className="w-full h-[400px] mt-10 flex flex-col items-center justify-center relative bg-transparent">
            <Hero3DViewer />
            <div className="absolute bottom-2 flex flex-col items-center pointer-events-none">
              <span className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">
                Swipe / Drag to Inspect 360°
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  EDITORIAL VALUE STRIP                                       */}
      {/* ============================================================ */}
      <section className="py-10 border-t border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <Box className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Lab Rates</span>
              <span className="block text-xs font-bold text-slate-900">Precision Prescription Lab</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <Truck className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Shipping</span>
              <span className="block text-xs font-bold text-slate-900">Flat 250 PKR Delivery</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Payments</span>
              <span className="block text-xs font-bold text-slate-900">EasyPaisa / Bank Transfer</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Virtual Engine</span>
              <span className="block text-xs font-bold text-slate-900">3D Virtual Try-On</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  INTERACTIVE LENS VISUALIZER                                 */}
      {/* ============================================================ */}
      <LensVisualizer />

      {/* ============================================================ */}
      {/*  4-STEP PRESCRIPTION ENGINE                                  */}
      {/* ============================================================ */}
      <PrescriptionSteps />

      {/* ============================================================ */}
      {/*  FEATURED COLLECTION GRID                                    */}
      {/* ============================================================ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 bg-white">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            SEASONAL EDIT
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Featured Frame Catalog
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Explore our most coveted shapes handcrafted with lightweight bio-acetate and premium titanium alloys.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[340px] bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center border border-slate-200 rounded-2xl text-slate-400 font-medium">
            No frames currently in catalog. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {products.slice(0, 6).map((product) => {
              const productImages = parseImages(product.images);
              return (
                <div
                  key={product.id}
                  className="group relative rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white p-5 transition-all duration-300 flex flex-col justify-between"
                >
                  <Link href={`/products/${product.slug}`} className="block space-y-4">
                    <div className="aspect-square bg-slate-50/50 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 relative">
                      {productImages[0] ? (
                        <img
                          src={productImages[0]}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Glasses className="w-12 h-12 text-slate-300" />
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:underline truncate">{product.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{product.material} · {product.frameShape}</p>
                    </div>
                  </Link>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="font-extrabold text-slate-900 text-sm">{formatPrice(product.price)}</span>
                    {product.category === "EYEGLASSES" ? (
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setRxModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Image src="/logo.svg" alt="My Eyes Logo" width={12} height={12} className="object-contain brightness-0 invert" />
                        My Eyes Configurator
                      </button>
                    ) : (
                      <button
                        onClick={() => addItem({
                          productId: product.id,
                          name: `${product.name} (Standard Sun Lenses)`,
                          price: product.price,
                          image: productImages[0] || "",
                        })}
                        className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-800 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer bg-white"
                      >
                        Add to Bag
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  CATEGORY SPOTLIGHT & LENS PRICING                           */}
      {/* ============================================================ */}
      <CategorySpotlight />

      {/* ============================================================ */}
      {/*  PAKISTAN-BASED CUSTOMER REVIEWS                              */}
      {/* ============================================================ */}
      <PakistanReviews />

      {/* Prescription Modal for Eyeglasses */}
      {rxModalOpen && selectedProduct && (
        <PrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price}
          onSubmit={(details, totalPrice) => {
            addItem({
              productId: selectedProduct.id,
              name: `${selectedProduct.name} (${details.lensUsage})`,
              price: totalPrice,
              image: parseImages(selectedProduct.images)[0] || "",
            });
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
