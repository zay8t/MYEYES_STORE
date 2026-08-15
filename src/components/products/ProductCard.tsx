"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatMaterial, formatFrameShape } from "@/lib/utils";
import { Glasses } from "lucide-react";

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
  purple: "#9333EA"
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
}

interface ProductCardProps {
  product: Product;
  onAddLenses?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddLenses, onAddToCart }: ProductCardProps) {
  // Fix image URL parsing
  const getProductImage = (): string => {
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

    // fallback check for product.image
    if (imagesList.length === 0 && product.image) {
      imagesList = [product.image];
    }

    const firstImage = imagesList[0] || "";

    if (!firstImage || firstImage === "/logo.png" || firstImage === "") {
      return "/placeholder-frame.png"; // Safe fallback image
    }

    return firstImage;
  };

  const imgUrl = getProductImage();

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
          src={imgUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Category Pill Badge pinned inside top right */}
        <span className="absolute top-3 right-3 z-10 bg-[#0F172A]/90 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
          {product.category || "Eyeglasses"}
        </span>
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

        {/* Color Swatch Dots */}
        {colorsList && colorsList.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {colorsList.map((c, i) => {
              const hex = COLOR_MAP[c.toLowerCase()] || c;
              return (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: hex }}
                  title={c}
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

