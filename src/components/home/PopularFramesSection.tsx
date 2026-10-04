"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { SafeProduct } from "@/lib/data-guards";
import ProductCard from "@/components/products/ProductCard";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface PopularFramesSectionProps {
  products: SafeProduct[];
  loading: boolean;
  onAddLenses: (product: SafeProduct) => void;
  onAddToCart: (product: SafeProduct) => void;
}

export default function PopularFramesSection({
  products,
  loading,
  onAddLenses,
  onAddToCart,
}: PopularFramesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const displayProducts = products.slice(0, 8);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate roughly which card is in view
    const cardWidth = 300; // approximate card + gap
    const newIdx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(newIdx, 0), displayProducts.length - 1));
  }, [displayProducts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = Math.min(el.clientWidth * 0.85, 360);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const cards = el.children;
    if (cards[idx]) {
      (cards[idx] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  };

  // Mouse Drag to Scroll handlers for smooth desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // multiplier for natural momentum
    el.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="py-14 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 bg-white">
      {/* Section Header with Navigation Buttons */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-amber-600" />
            TOP PICKS & BESTSELLERS
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Popular Frames
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed">
            Explore our most loved eyeglasses and sunglasses, crafted with ultra-lightweight, resilient titanium and acetate.
          </p>
        </div>

        {/* Desktop/Tablet Smooth Arrow Controls */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous frames"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Next frames"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[280px] sm:min-w-[320px] lg:min-w-[340px] snap-start shrink-0 h-[380px] bg-slate-50 rounded-2xl border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="p-16 text-center border border-slate-200 rounded-2xl text-slate-400 font-medium">
          No frames currently in catalog. Check back soon.
        </div>
      ) : (
        <div className="relative group/slider">
          {/* Scrollable Container with Hardware-accelerated Momentum Snapping */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth overscroll-x-contain select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab md:cursor-default"
            }`}
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-[280px] sm:min-w-[320px] lg:min-w-[340px] max-w-[340px] snap-start shrink-0 flex flex-col transition-transform duration-200"
              >
                <ProductCard
                  product={product}
                  onAddLenses={(p) => onAddLenses(p as SafeProduct)}
                  onAddToCart={(p) => onAddToCart(p as SafeProduct)}
                />
              </div>
            ))}
          </div>

          {/* Mobile Dot Navigation Indicator */}
          {displayProducts.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {displayProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === idx
                      ? "w-6 bg-slate-900"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
