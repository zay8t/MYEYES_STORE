"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, ShieldCheck, Glasses, Wand2, Compass, CheckCircle2 } from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";
import GeminiFrameStylist from "@/components/ai/GeminiFrameStylist";

interface VirtualAssistantBannerProps {
  products: SafeProduct[];
  onSelectProduct: (product: SafeProduct) => void;
}

export default function VirtualAssistantBanner({
  products,
  onSelectProduct,
}: VirtualAssistantBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pick up to 3 showcase frames from live inventory for floating preview cards
  const previewProducts = products.slice(0, 3);

  const getProductImage = (product: SafeProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === "string" && product.images) {
      return product.images;
    }
    return "/placeholder-frame.png";
  };

  return (
    <>
      <section className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0B132B] to-slate-900 border border-amber-500/20 shadow-2xl">
          {/* Subtle Ambient Gold Glow Backgrounds */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline & Launch CTA */}
              <div className="lg:col-span-7 space-y-5 text-left">
                {/* Atelier Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>MY EYES AI Optical Atelier</span>
                </div>

                {/* Primary Heading */}
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                  Virtual Optical Stylist &
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                    Bespoke Frame Fitting
                  </span>
                </h2>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-300 font-normal max-w-xl leading-relaxed">
                  Discover frames mathematically proportioned to your facial geometry, skin tone finish, and daily prescription needs in under 60 seconds.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2.5 pt-1 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Facial Geometry Calibration</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <Glasses className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prescription & Lens Sync</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Master Optician Rationale</span>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Wand2 className="w-4 h-4 text-slate-950 transition-transform group-hover:rotate-12" />
                    <span>Launch Virtual Assistant</span>
                    <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    No sign-up required • Instant recommendations
                  </span>
                </div>
              </div>

              {/* Right Column: Floating Luxury Studio Frame Thumbnails */}
              <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
                <div className="w-full max-w-sm space-y-3">
                  {previewProducts.length > 0 ? (
                    previewProducts.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        onClick={() => {
                          onSelectProduct(p);
                        }}
                        className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 group cursor-pointer shadow-lg hover:-translate-y-0.5 ${
                          idx === 1 ? "sm:translate-x-3 border-amber-500/30 bg-slate-900/90" : ""
                        }`}
                      >
                        <div className="relative w-14 h-11 bg-white/5 rounded-xl border border-white/5 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          <Image
                            src={getProductImage(p)}
                            alt={p.name}
                            fill
                            className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400">
                              Optical Recommendation
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {p.name}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-300">
                            Rs. {p.price.toLocaleString()}/-
                          </span>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-white/5 group-hover:bg-amber-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center transition-colors shrink-0">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-400 text-xs">
                      Curated bespoke optical catalogue loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Centered Modal with backdrop blur for the Consultative Assistant */}
      <GeminiFrameStylist
        products={products}
        onSelectProduct={(p) => {
          onSelectProduct(p);
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isModal={true}
      />
    </>
  );
}
