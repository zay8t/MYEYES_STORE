"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Glasses, Sun, ArrowRight, Sparkles, Truck, ShieldCheck, CreditCard, Box } from "lucide-react";
import { formatPrice, formatFrameShape, formatMaterial } from "@/lib/utils";
import { safeProductList } from "@/lib/data-guards";
import { useCartStore } from "@/lib/cart-store";

import dynamic from "next/dynamic";
import PrescriptionModal from "@/components/PrescriptionModal";
import LensVisualizer from "@/components/home/LensVisualizer";
import PrescriptionSteps from "@/components/home/PrescriptionSteps";
import CategorySpotlight from "@/components/home/CategorySpotlight";
import PakistanReviews from "@/components/home/PakistanReviews";

const Frame3DCanvasWrapper = dynamic(
  () => import("@/components/3d/Frame3DCanvasWrapper"),
  { ssr: false }
);

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
    try {
      fetch("/api/admin/products")
        .then((res) => res.json())
        .then((data) => {
          setProducts(safeProductList(data) as unknown as Product[]);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load products for homepage:", err);
          setProducts([]);
          setLoading(false);
        });
    } catch {
      setProducts([]);
      setLoading(false);
    }
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
      <section className="relative pt-24 pb-16 sm:pb-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 text-[11px] font-bold uppercase tracking-widest text-brand-dark shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
            Pakistan&apos;s #1 Online Eyewear Store
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Pakistan&apos;s First
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700">
              Prescription Based Eyewear Store
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Lab-precision prescription eyeglasses and sunglasses with custom SPH, CYL, and PD fitting — delivered anywhere in Pakistan.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/eyeglasses"
              className="btn-press w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] flex items-center justify-center gap-2.5 shadow-md"
            >
              <Glasses className="w-4 h-4" />
              Explore Eyeglasses
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/sunglasses"
              className="btn-press w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-slate-200/80 hover:border-amber-500 bg-white hover:bg-amber-50/50 text-slate-900 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2.5"
            >
              <Sun className="w-4 h-4 text-amber-600" />
              Explore Sunglasses
            </Link>
          </div>

          {/* 3D Eyewear Studio Canvas */}
          <div className="relative w-full max-w-4xl mx-auto min-h-[460px] sm:min-h-[500px] md:h-[520px] mt-6 sm:mt-8 flex items-center justify-center bg-transparent z-10">
            <Frame3DCanvasWrapper />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  EDITORIAL VALUE STRIP                                       */}
      {/* ============================================================ */}
      <section className="py-12 border-t border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
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
                  className="card-hover group relative rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white p-5 transition-all duration-300 flex flex-col justify-between"
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
                      <p className="text-[11px] text-slate-500 font-medium">{formatMaterial(product.material)} · {formatFrameShape(product.frameShape)}</p>
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
              prescription: details,
            });
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
