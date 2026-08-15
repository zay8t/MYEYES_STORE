'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  category?: string;
}

export default function ProductGallery({
  images,
  productName,
  category = 'Eyeglasses',
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const cleanImages = (images || [])
    .map((img) => (img === '/logo.png' || !img ? '/placeholder-frame.png' : img))
    .filter(Boolean);

  const galleryImages = cleanImages.length > 0 ? cleanImages : ['/placeholder-frame.png'];

  const scrollToImage = useCallback((index: number) => {
    if (index < 0 || index >= galleryImages.length) return;
    setCurrentIndex(index);
    if (scrollRef.current) {
      isScrollingRef.current = true;
      const scrollWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: scrollWidth * index,
        behavior: 'smooth',
      });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    }
  }, [galleryImages.length]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrollingRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    if (offsetWidth > 0) {
      const newIndex = Math.round(scrollLeft / offsetWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < galleryImages.length) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, galleryImages.length]);

  // Handle window resize recalculation
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        const scrollWidth = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
          left: scrollWidth * currentIndex,
          behavior: 'auto',
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  return (
    <div className="w-full space-y-4 select-none">
      {/* Main Swipeable Carousel Container */}
      <div className="relative group rounded-3xl overflow-hidden bg-neutral-50 border border-neutral-200/80 shadow-2xs">
        {/* Category Badge */}
        <span className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full shadow-sm">
          {category}
        </span>

        {/* Swipeable Snap Track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {galleryImages.map((src, index) => (
            <div
              key={index}
              className="w-full shrink-0 snap-center aspect-square md:aspect-[4/3] relative bg-neutral-50 flex items-center justify-center p-4 md:p-8"
            >
              <Image
                src={src}
                alt={`${productName} view ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="object-contain p-4 md:p-6 w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Floating Left / Right Chevron Controls */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToImage(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-neutral-200 text-slate-900 flex items-center justify-center transition-all cursor-pointer ${
                currentIndex === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-80 group-hover:opacity-100 hover:bg-white hover:scale-110'
              }`}
              aria-label="Previous frame angle"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => scrollToImage(Math.min(galleryImages.length - 1, currentIndex + 1))}
              disabled={currentIndex === galleryImages.length - 1}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-neutral-200 text-slate-900 flex items-center justify-center transition-all cursor-pointer ${
                currentIndex === galleryImages.length - 1
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-80 group-hover:opacity-100 hover:bg-white hover:scale-110'
              }`}
              aria-label="Next frame angle"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Pagination Dots Indicator */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/80 shadow-2xs">
            {galleryImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToImage(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-slate-900' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Synchronized Thumbnails Strip */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {galleryImages.map((src, index) => {
            const isActive = currentIndex === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => scrollToImage(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-neutral-50 cursor-pointer p-1.5 ${
                  isActive
                    ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm scale-102 opacity-100'
                    : 'border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-300'
                }`}
                title={`Angle ${index + 1}`}
              >
                <Image
                  src={src}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
