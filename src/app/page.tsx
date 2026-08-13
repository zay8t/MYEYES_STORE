"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import { useCartStore } from "@/lib/cart-store";
import { Glasses, Sun, ArrowRight, Sparkles, Truck, ShieldCheck, CreditCard, Box, Calculator } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

import dynamic from "next/dynamic";
import PrescriptionModal from "@/components/PrescriptionModal";
import LensVisualizer from "@/components/home/LensVisualizer";
import PrescriptionSteps from "@/components/home/PrescriptionSteps";
import CategorySpotlight from "@/components/home/CategorySpotlight";


const Frame3DCanvasWrapper = dynamic(
  () => import("@/components/3d/Frame3DCanvasWrapper"),
  { ssr: false }
);

export default function HomePage() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
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

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                */}
      {/* ============================================================ */}
      <section className="relative pt-24 pb-4 bg-white">
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
        </div>
      </section>

      {/* ============================================================ */}
      {/*  DEDICATED HERO ACTION BAR SECTION WITH BACKGROUND IMAGE     */}
      {/* ============================================================ */}
      <section className="relative w-full py-8 my-6 overflow-hidden border-y border-neutral-200/60 shadow-inner bg-white">
        {/* Background Image Layer with Gradient & Blur Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 scale-105 pointer-events-none filter blur-[1px]" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-neutral-50/80 to-white opacity-90 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-center gap-2.5 md:gap-4 w-full max-w-md md:max-w-none">
          
          {/* Button 1 (PRIMARY): Start with a quiz */}
          <Link
            href="/quiz"
            id="hero-style-quiz-btn"
            className="group w-full md:w-auto h-[44px] px-6 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-amber-500/15 backdrop-blur-md transition-all duration-200 bg-[#F59E0B] text-white hover:bg-[#D97706] inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span>Start with a quiz</span>
          </Link>

          {/* Button 2 (SECONDARY): Explore eyeglasses */}
          <Link
            href="/eyeglasses"
            id="hero-eyeglasses-btn"
            className="group w-full md:w-auto h-[44px] px-6 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md backdrop-blur-md transition-all duration-200 bg-[#0F172A] text-white hover:bg-[#1E293B] inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Glasses className="w-4 h-4 text-white shrink-0" />
            <span>Explore eyeglasses</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/80 shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Button 3 (OUTLINE): Explore sunglasses */}
          <Link
            href="/sunglasses"
            id="hero-sunglasses-btn"
            className="group w-full md:w-auto h-[44px] px-6 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-sm backdrop-blur-md transition-all duration-200 bg-white/90 text-[#0F172A] border-2 border-[#0F172A] hover:bg-[#0F172A] hover:text-white inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Sun className="w-4 h-4 shrink-0 group-hover:rotate-45 transition-transform duration-500" />
            <span>Explore sunglasses</span>
          </Link>

          {/* Button 4 (UTILITY): Live prescription calculator */}
          <Link
            href="/lens-pricing"
            id="hero-prescription-btn"
            className="group w-full md:w-auto h-[44px] px-6 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-sm backdrop-blur-md transition-all duration-200 bg-neutral-100/90 text-[#0F172A] border border-neutral-300 hover:bg-neutral-200 inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Calculator className="w-4 h-4 text-[#0F172A] shrink-0" />
            <span>Live prescription calculator</span>
            <span className="relative flex h-2 w-2 shrink-0 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Link>

        </div>
      </section>

      {/* ============================================================ */}
      {/*  3D MODEL DISPLAY                                            */}
      {/* ============================================================ */}
      <section className="relative pb-16 sm:pb-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
            {products.slice(0, 6).map((product) => (
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
      </section>

      {/* ============================================================ */}
      {/*  CATEGORY SPOTLIGHT & LENS PRICING                           */}
      {/* ============================================================ */}
      <CategorySpotlight />



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
              image: selectedProduct.images[0] || "",
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
