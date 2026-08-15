"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatMaterial, formatFrameShape } from "@/lib/utils";

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
    <div className="card-hover group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
      <Link href={`/products/${product.slug}`} className="block relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-t-2xl bg-neutral-100">
        <Image
          alt={product.name}
          className="object-cover object-center w-full h-full transition-transform duration-500 hover:scale-105"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imgUrl}
        />
        {/* Category Badge positioned cleanly inside top-right */}
        <span className="absolute top-3 right-3 bg-[#0F172A]/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
          {product.category}
        </span>
      </Link>

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>{formatFrameShape(product.frameShape)}</span>
            <span>{formatMaterial(product.material)}</span>
          </div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-bold text-slate-900 text-sm group-hover:underline truncate">{product.name}</h3>
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.description}</p>
          
          {/* Color Indicator Dots */}
          {colorsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {colorsList.map((c) => {
                const hex = COLOR_MAP[c.toLowerCase()];
                if (!hex) return null;
                return (
                  <span
                    key={c}
                    className="w-2.5 h-2.5 rounded-full border border-slate-200 shadow-2xs block shrink-0"
                    style={{ backgroundColor: hex }}
                    title={c}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <span className="font-extrabold text-slate-900 text-sm">{formatPrice(product.price)}</span>
          
          {product.category === "EYEGLASSES" ? (
            <button
              onClick={() => onAddLenses && onAddLenses(product)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Image src="/logo.svg" alt="My Eyes Logo" width={12} height={12} className="object-contain brightness-0 invert" />
              <span>Add Lenses</span>
            </button>
          ) : (
            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              <span>Add to Bag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
