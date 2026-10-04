"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
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

  // Up to 2 sample frames for clean subtle previews on sides
  const previewProducts = products.slice(0, 2);

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
      <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-2 border-amber-300/80 shadow-md">
          {/* Subtle Ambient Gold Glow Backgrounds */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-5 sm:py-6 flex items-center justify-between gap-4">
            {/* Left Frame Preview (Desktop) */}
            {previewProducts[0] && (
              <div
                onClick={() => setIsModalOpen(true)}
                className="hidden lg:flex items-center bg-white border border-amber-200/90 hover:border-amber-500 p-2 rounded-2xl cursor-pointer transition-all duration-300 group shadow-2xs hover:scale-105"
              >
                <div className="relative w-16 h-12 bg-slate-50/80 rounded-xl p-1 overflow-hidden flex items-center justify-center">
                  <Image
                    src={getProductImage(previewProducts[0])}
                    alt={previewProducts[0].name}
                    fill
                    className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            )}

            {/* Central CTA Button */}
            <div className="w-full lg:w-auto flex items-center justify-center mx-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-3 px-8 sm:px-14 py-4 sm:py-4.5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden border border-amber-400/40"
              >
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <span>MY EYES AI ASSISTANT</span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Right Frame Preview (Desktop) */}
            {previewProducts[1] && (
              <div
                onClick={() => setIsModalOpen(true)}
                className="hidden lg:flex items-center bg-white border border-amber-200/90 hover:border-amber-500 p-2 rounded-2xl cursor-pointer transition-all duration-300 group shadow-2xs hover:scale-105"
              >
                <div className="relative w-16 h-12 bg-slate-50/80 rounded-xl p-1 overflow-hidden flex items-center justify-center">
                  <Image
                    src={getProductImage(previewProducts[1])}
                    alt={previewProducts[1].name}
                    fill
                    className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Free-form Conversational Modal Interface */}
      <GeminiFrameStylist
        products={products}
        onSelectProduct={(p) => {
          onSelectProduct(p);
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
