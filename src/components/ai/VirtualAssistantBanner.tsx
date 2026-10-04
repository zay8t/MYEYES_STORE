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

  // Up to 2 sample frames for subtle clean frame previews on sides
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
        <div className="relative overflow-hidden rounded-3xl bg-[#0B132B] border border-amber-500/20 shadow-xl">
          {/* Subtle Ambient Gold Glow Backgrounds */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left side subtle preview frame (desktop only, no text) */}
            {previewProducts[0] && (
              <div
                onClick={() => setIsModalOpen(true)}
                className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 hover:border-amber-500/40 p-2.5 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm"
              >
                <div className="relative w-16 h-12 bg-white/5 rounded-xl p-1 overflow-hidden flex items-center justify-center">
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
            <div className="w-full md:w-auto flex items-center justify-center mx-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <span>MY EYES AI ASSISTANT</span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Right side subtle preview frame (desktop only, no text) */}
            {previewProducts[1] && (
              <div
                onClick={() => setIsModalOpen(true)}
                className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 hover:border-amber-500/40 p-2.5 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm"
              >
                <div className="relative w-16 h-12 bg-white/5 rounded-xl p-1 overflow-hidden flex items-center justify-center">
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

      {/* Centered Modal for Consultative Assistant */}
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
