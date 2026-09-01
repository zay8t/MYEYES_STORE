"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import { useCartStore } from "@/lib/cart-store";
import { Glasses, Sun, Sparkles, Truck, ShieldCheck, CreditCard, Box, Calculator } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

import dynamic from "next/dynamic";
import PrescriptionModal from "@/components/PrescriptionModal";
import FaceShapeMatcher from "@/components/home/FaceShapeMatcher";
import OrderingJourney from "@/components/home/OrderingJourney";
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
      fetch("/api/products", { cache: "no-store" })
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
    <div className="bg-white text-slate-900 pb-8">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                */}
      {/* ============================================================ */}
      <section className="relative pt-6 sm:pt-10 pb-2 sm:pb-3 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <div className="mb-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold uppercase tracking-widest text-amber-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7a00] animate-pulse" />
            Pakistan&apos;s #1 Online Eyewear Store
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Pakistan&apos;s First
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700">
              Prescription Based Eyewear Store
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Custom glasses made to your exact eye numbers — delivered to your doorstep anywhere in Pakistan.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SEAMLESS HERO BANNER SECTION (bg-white)                     */}
      {/* ============================================================ */}
      <section className="w-full bg-white pt-2 sm:pt-4 pb-4 sm:pb-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-xl space-y-4 text-left">
            {/* 1. Category Pill Badge */}
            <span className="inline-block text-[11px] sm:text-xs font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full uppercase">
              FIND YOUR LOOK
            </span>

            {/* 2. Main Headline */}
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase text-[#0F172A]">
              Find Your <span className="text-[#F59E0B]">Perfect Pair</span>
            </h2>

            {/* 3. Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Great-looking glasses made with clear, high-quality lenses. Take our quick 1-minute quiz or browse all styles.
            </p>

            {/* 4. 4-Button Arrangement */}
            <div className="pt-2 grid grid-cols-2 gap-2.5 w-full max-w-md sm:flex sm:flex-wrap sm:items-center">
              {/* Button 1: Start with a quiz */}
              <Link
                href="/quiz"
                className="h-[42px] w-full sm:w-auto px-4 sm:px-6 rounded-full bg-[#F59E0B] text-white hover:bg-[#D97706] transition-all flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-white" />
                <span className="truncate">Take 1-Min Quiz</span>
              </Link>

              {/* Button 2: Shop eyeglasses */}
              <Link
                href="/eyeglasses"
                className="h-[42px] w-full sm:w-auto px-4 sm:px-6 rounded-full bg-[#F0F4F8] text-[#0B132B] shadow-sm hover:bg-[#E2E8F0] border border-slate-200/60 transition-all flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap"
              >
                <Glasses className="w-3.5 h-3.5 shrink-0 text-[#0B132B]" />
                <span className="truncate">Shop Eyeglasses</span>
              </Link>

              {/* Button 3: Shop sunglasses */}
              <Link
                href="/sunglasses"
                className="h-[42px] w-full sm:w-auto px-4 sm:px-6 rounded-full bg-[#0B132B] text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm"
              >
                <Sun className="w-3.5 h-3.5 shrink-0 text-white" />
                <span className="truncate">Shop Sunglasses</span>
              </Link>

              {/* Button 4: Lens Pricing */}
              <Link
                href="/lens-pricing"
                className="h-[42px] w-full sm:w-auto px-4 sm:px-6 rounded-full bg-transparent text-[#0B132B] border-2 border-[#0B132B] hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm"
              >
                <Calculator className="w-3.5 h-3.5 shrink-0 text-[#0B132B]" />
                <span className="truncate">See Lens Prices</span>
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
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Lab Prices</span>
              <span className="block text-xs font-bold text-slate-900">Quality Lenses for Less</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <Truck className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Delivery</span>
              <span className="block text-xs font-bold text-slate-900">Rs. 250 Flat Rate</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Easy Pay</span>
              <span className="block text-xs font-bold text-slate-900">EasyPaisa, JazzCash & Cards</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-slate-800 mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">3D Try-On</span>
              <span className="block text-xs font-bold text-slate-900">See How Frames Look on You</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FIND BY FACE SHAPE: PRECISION FIT MATCHER                   */}
      {/* ============================================================ */}
      <FaceShapeMatcher
        products={products}
        onAddLenses={(product) => {
          setSelectedProduct(product);
          setRxModalOpen(true);
        }}
      />

      {/* ============================================================ */}
      {/*  4-STEP PRESCRIPTION ORDERING JOURNEY                         */}
      {/* ============================================================ */}
      <OrderingJourney />

      {/* ============================================================ */}
      {/*  FEATURED COLLECTION GRID                                    */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10 bg-white">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            TOP PICKS
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Popular Frames
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Explore our most loved eyeglasses and sunglasses, made with lightweight, long-lasting materials.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[340px] bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center border border-slate-200 rounded-2xl text-slate-400 font-medium">
            No frames currently in catalog. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
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
