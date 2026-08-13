"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import { useCartStore } from "@/lib/cart-store";
import { Glasses, Sun, Sparkles, Truck, ShieldCheck, CreditCard, Box, Calculator } from "lucide-react";
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
      {/*  SEAMLESS HERO BANNER SECTION (bg-slate-950)                 */}
      {/* ============================================================ */}
      <section className="relative w-full py-12 md:py-20 my-6 overflow-hidden bg-slate-950 text-white">
        {/* High-Fashion Eyewear Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105 pointer-events-none" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80')" }} 
        />
        
        {/* Edge Fades: Seamlessly blends top and bottom into page background */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        
        {/* High-Contrast Radial/Linear Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-0 pointer-events-none" />

        {/* Content Container aligned with Store Layout */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl space-y-4 text-left">
            {/* Category Pill */}
            <span className="inline-block text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full">
              MY EYES • Fall 2026 Collection
            </span>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase text-white">
              Find Your <span className="text-[#F59E0B]">Frame</span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Lab-precision optics meets high-fashion hand-crafted frames. Try our 1-minute style quiz or explore our catalog.
            </p>

            {/* 4 Seamless & High-Contrast Pill Buttons Container */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5 max-w-lg">
              
              {/* Button 1 (PRIMARY): Start with a quiz */}
              <Link
                href="/quiz"
                id="hero-style-quiz-btn"
                className="bg-[#F59E0B] text-white hover:bg-[#D97706] rounded-full h-[42px] px-5 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.03] shadow-md shadow-amber-500/20 text-xs sm:text-sm whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Start with a quiz</span>
              </Link>

              {/* Button 2 (SECONDARY): Shop eyeglasses */}
              <Link
                href="/eyeglasses"
                id="hero-eyeglasses-btn"
                className="bg-slate-900 text-white border border-slate-700 hover:bg-slate-800 rounded-full h-[42px] px-5 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.03] shadow-md text-xs sm:text-sm whitespace-nowrap animate-in fade-in zoom-in-95 duration-300 delay-75"
              >
                <Glasses className="w-4 h-4 text-white" />
                <span>Shop eyeglasses</span>
              </Link>

              {/* Button 3 (TERTIARY): Shop sunglasses */}
              <Link
                href="/sunglasses"
                id="hero-sunglasses-btn"
                className="bg-white/20 hover:bg-white hover:text-slate-900 text-white backdrop-blur-md border border-white/30 rounded-full h-[42px] px-5 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.03] text-xs sm:text-sm whitespace-nowrap animate-in fade-in zoom-in-95 duration-300 delay-150"
              >
                <Sun className="w-4 h-4" />
                <span>Shop sunglasses</span>
              </Link>

              {/* Button 4 (UTILITY - HIGH VISIBILITY FIX): Live calculator */}
              <Link
                href="/lens-pricing"
                id="hero-prescription-btn"
                className="bg-white text-slate-900 hover:bg-slate-100 rounded-full h-[42px] px-5 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.03] shadow-md cursor-pointer text-xs sm:text-sm whitespace-nowrap animate-in fade-in zoom-in-95 duration-300 delay-200"
              >
                <Calculator className="w-4 h-4 text-slate-900" />
                <span>Live calculator</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </Link>

            </div>
          </div>
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
