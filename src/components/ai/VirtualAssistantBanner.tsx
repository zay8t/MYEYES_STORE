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

  return (
    <>
      <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="relative overflow-hidden rounded-3xl h-[280px] sm:h-[320px] md:h-[340px] bg-white flex flex-col justify-end p-5 sm:p-8">
          {/* Side-by-side Two-Image Collage Background */}
          <div className="absolute inset-0 grid grid-cols-2 w-full h-full">
            {/* Left Image: frame.jpg */}
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src="/frame.jpg"
                alt="MY EYES Frame Model 1"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1440px) 50vw, 720px"
              />
            </div>

            {/* Right Image: frame2.jpg */}
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src="/frame2.jpg"
                alt="MY EYES Frame Model 2"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1440px) 50vw, 720px"
              />
            </div>
          </div>

          {/* Clarity & Readability Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />

          {/* Action Button positioned neatly in the bottom right */}
          <div className="relative z-10 flex items-center justify-center sm:justify-end w-full">
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative inline-flex items-center justify-center gap-3 px-7 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden border border-amber-300/40"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              <span>MY EYES AI ASSISTANT</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1.5 transition-transform" />
            </button>
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
