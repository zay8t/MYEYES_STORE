"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Glasses, Sun } from "lucide-react";
import { formatPrice, formatMaterial, formatFrameShape } from "@/lib/utils";

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
  images: any; // Can be string, string[], or JSON string
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

  return (
    <div className="card-hover group relative rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 flex flex-col justify-between">
      <Link href={`/products/${product.slug}`} className="block space-y-4">
        <div className="aspect-[4/3] bg-slate-50/50 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 relative">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              {product.category === "SUNGLASSES" ? (
                <Sun className="w-12 h-12 stroke-[1.25]" />
              ) : (
                <Glasses className="w-12 h-12 stroke-[1.25]" />
              )}
            </div>
          )}
          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>{formatFrameShape(product.frameShape)}</span>
            <span>{formatMaterial(product.material)}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm group-hover:underline truncate">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.description}</p>
        </div>
      </Link>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
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
  );
}
