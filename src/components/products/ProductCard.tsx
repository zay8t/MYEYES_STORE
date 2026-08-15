"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatMaterial, formatFrameShape, cn } from "@/lib/utils";
import { Glasses } from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";

const COLOR_MAP: Record<string, string> = {
  black: "#18181B",
  tortoise: "#6B3E11",
  crystal: "#E2E8F0",
  grey: "#64748B",
  amber: "#D97706",
  gold: "#EAB308",
  silver: "#94A3B8",
  rose_gold: "#FB7185",
  red: "#DC2626",
  blue: "#2563EB",
  teal: "#06B6D4",
  green: "#16A34A",
  orange: "#EA580C",
  pink: "#EC4899",
  purple: "#9333EA",
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  frameShape: string;
  material: string;
  gender: string;
  colors?: string | string[];
  images: string | string[]; // Can be string, string[], or JSON string
  image?: string; // fallback field if defined
  featured: boolean;
  category: string;
  formattedPrice?: string;
  formattedShape?: string;
  formattedMaterial?: string;
  firstImage?: string;
  createdAt?: string;
}

interface ProductCardProps {
  product: Product | SafeProduct;
  onAddLenses?: (product: Product | SafeProduct) => void;
  onAddToCart?: (product: Product | SafeProduct) => void;
}

export default function ProductCard({ product, onAddLenses, onAddToCart }: ProductCardProps) {
  // Parse all product images
  const getAllProductImages = (): string[] => {
    let imagesList: string[] = [];

    const rawImages = product.images;
    if (Array.isArray(rawImages)) {
      imagesList = rawImages;
    } else if (typeof rawImages === "string") {
      const trimmed = rawImages.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            imagesList = parsed;
          }
        } catch {
          imagesList = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else {
        imagesList = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const fallbackImg = "image" in product && typeof (product as { image?: string }).image === "string"
      ? (product as { image?: string }).image
      : undefined;

    if (imagesList.length === 0 && fallbackImg) {
      imagesList = [fallbackImg];
    }

    const cleanList = imagesList.filter(
      (img) => img && img !== "/logo.png" && img !== ""
    );

    return cleanList.length > 0 ? cleanList : ["/placeholder-frame.png"];
  };

  const imagesList = getAllProductImages();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);

  const activeImageUrl = imagesList[selectedVariantIdx % imagesList.length] || imagesList[0];

  const getProductColors = (): string[] => {
    const rawColors = product.colors;
    if (!rawColors) return [];
    if (Array.isArray(rawColors)) return rawColors;
    if (typeof rawColors === "string") {
      const trimmed = rawColors.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const colorsList = getProductColors();

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white hover:shadow-lg transition-all duration-300 group">
      {/* 100% Full-width top image container */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative w-full aspect-[4/3] sm:aspect-[16/11] bg-neutral-100 overflow-hidden"
      >
        <Image
          src={activeImageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Category Pill Badge pinned inside top right */}
        <span className="absolute top-3 right-3 z-10 bg-[#0F172A]/90 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
          {product.category || "Eyeglasses"}
        </span>

        {/* Variant Indicator if multiple images exist */}
        {imagesList.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {selectedVariantIdx + 1}/{imagesList.length}
          </div>
        )}
      </Link>

      {/* Content Container with isolated padding */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        {/* Shape / Material Row */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{formatFrameShape(product.frameShape)}</span>
          <span>{formatMaterial(product.material)}</span>
        </div>

        {/* Title & Description */}
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:underline">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
        </div>

        {/* Interactive In-Card Color Swatch Dots */}
        {colorsList && colorsList.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {colorsList.map((c, i) => {
              const hex = COLOR_MAP[c.toLowerCase()] || c;
              const isSelected = selectedVariantIdx === i;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setSelectedVariantIdx(i % imagesList.length)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIdx(i % imagesList.length);
                  }}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border shadow-2xs transition-all cursor-pointer",
                    isSelected
                      ? "ring-2 ring-slate-900 ring-offset-1 scale-110 border-black/30"
                      : "border-black/15 hover:scale-110"
                  )}
                  style={{ backgroundColor: hex }}
                  title={`${c} variant`}
                />
              );
            })}
          </div>
        )}

        {/* Price & Add Lenses CTA Button */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          <span className="text-sm sm:text-base font-extrabold text-slate-900">
            {formatPrice(product.price)}
          </span>

          {product.category === "EYEGLASSES" || !product.category ? (
            <button
              onClick={() => onAddLenses && onAddLenses(product)}
              className="h-[36px] px-4 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>ADD LENSES</span>
            </button>
          ) : (
            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="h-[36px] px-4 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>ADD TO BAG</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
