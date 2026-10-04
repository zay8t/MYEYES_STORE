"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeProductList, SafeProduct } from "@/lib/data-guards";
import { useCartStore } from "@/lib/cart-store";
import { Glasses, Sun, Sparkles, Truck, ShieldCheck, CreditCard, Box, Calculator } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

import dynamic from "next/dynamic";
import LensConfiguratorModal from "@/components/configurator/LensConfiguratorModal";
import FaceShapeMatcher from "@/components/home/FaceShapeMatcher";
import OrderingJourney from "@/components/home/OrderingJourney";
import PopularFramesSection from "@/components/home/PopularFramesSection";
import CategorySpotlight from "@/components/home/CategorySpotlight";
import ProductDrawer from "@/components/ProductDrawer";

const Frame3DCanvasWrapper = dynamic(
  () => import("@/components/3d/Frame3DCanvasWrapper"),
  { ssr: false }
);

export default function HomePage() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);
  const [drawerProduct, setDrawerProduct] = useState<SafeProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div className="bg-white text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* ============================================================ */}
      {/* HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative pt-12 sm:pt-16 pb-6 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold uppercase tracking-widest text-amber-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7a00] animate-pulse" />
            Pakistan&apos;s #1 Online Eyewear Store
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Pakistan&apos;s First
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700">
              Prescription Based Eyewear Store
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            Custom glasses made to your exact eye numbers — delivered to your doorstep anywhere in Pakistan.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FIND YOUR LOOK / ACTION BUTTONS BAR                          */}
      {/* ============================================================ */}
      <section className="w-full bg-white pb-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Expanded container width to max-w-5xl so all 4 buttons fit comfortably */}
          <div className="max-w-5xl mx-auto text-center space-y-3 bg-slate-50/60 p-6 sm:p-8 rounded-3xl border border-slate-100">
            <span className="inline-block text-[11px] sm:text-xs font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full uppercase">
              FIND YOUR LOOK
            </span>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-[#0F172A]">
              Find Your <span className="text-[#F59E0B]">Perfect Pair</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
              Great-looking glasses made with clear, high-quality lenses. Take our quick 1-minute quiz or browse all styles.
            </p>

            {/* Single line flex with responsive padding & text sizing */}
            <div className="pt-3 flex flex-row items-center justify-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <Link
                href="/quiz"
                className="h-[40px] px-4 rounded-full bg-[#F59E0B] text-white hover:bg-[#D97706] transition-all flex items-center justify-center gap-1 font-bold text-xs whitespace-nowrap shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-white" />
                <span>Quiz</span>
              </Link>

              <Link
                href="/eyeglasses"
                className="h-[40px] px-4 rounded-full bg-white text-[#0B132B] shadow-sm hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-1 font-bold text-xs whitespace-nowrap"
              >
                <Glasses className="w-3 h-3 text-[#0B132B]" />
                <span>Eyeglasses</span>
              </Link>

              <Link
                href="/sunglasses"
                className="h-[40px] px-4 rounded-full bg-[#0B132B] text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1 font-bold text-xs whitespace-nowrap shadow-sm"
              >
                <Sun className="w-3 h-3 text-white" />
                <span>Sunglasses</span>
              </Link>

              <Link
                href="/lens-pricing"
                className="h-[40px] px-4 rounded-full bg-transparent text-[#0B132B] border-2 border-[#0B132B] hover:bg-slate-50 transition-all flex items-center justify-center gap-1 font-bold text-xs whitespace-nowrap shadow-sm"
              >
                <Calculator className="w-3 h-3 text-[#0B132B]" />
                <span>Lens Prices</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3D MODEL DISPLAY (UNTOUCHED)                                 */}
      {/* ============================================================ */}
      <section className="relative pb-16 sm:pb-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative w-full max-w-4xl mx-auto min-h-[460px] sm:min-h-[500px] md:h-[520px] mt-6 sm:mt-8 flex items-center justify-center bg-transparent z-10">
            <Frame3DCanvasWrapper />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* EDITORIAL VALUE STRIP                                        */}
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
      {/* FIND BY FACE SHAPE: PRECISION FIT MATCHER                    */}
      {/* ============================================================ */}
      <FaceShapeMatcher
        products={products}
        onAddLenses={(product) => {
          setSelectedProduct(product);
          setRxModalOpen(true);
        }}
      />

      {/* ============================================================ */}
      {/* 4-STEP PRESCRIPTION ORDERING JOURNEY                         */}
      {/* ============================================================ */}
      <OrderingJourney />

      {/* ============================================================ */}
      {/* FEATURED POPULAR FRAMES CAROUSEL & GRID                      */}
      {/* ============================================================ */}
      <PopularFramesSection
        products={products}
        loading={loading}
        onCardClick={(product) => {
          setDrawerProduct(product);
          setDrawerOpen(true);
        }}
        onAddLenses={(product) => {
          setSelectedProduct(product);
          setRxModalOpen(true);
        }}
        onAddToCart={(product) => {
          addItem({
            productId: product.id,
            name: `${product.name} (Standard Sun Lenses)`,
            price: product.price,
            image: product.images[0] || "",
          });
        }}
      />

      {/* ============================================================ */}
      {/* CATEGORY SPOTLIGHT & LENS PRICING                            */}
      {/* ============================================================ */}
      <CategorySpotlight />

      {/* Slide-over Product Detail Drawer */}
      <ProductDrawer
        isOpen={drawerOpen}
        product={drawerProduct}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerProduct(null);
        }}
        onAddLenses={(p) => {
          setSelectedProduct(p as SafeProduct);
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

      {/* Lens Configurator Modal for Eyeglasses */}
      {rxModalOpen && selectedProduct && (
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