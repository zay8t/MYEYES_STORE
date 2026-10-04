"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Glasses, Sun, Sparkles, Truck, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";
import { Product } from "@/components/products/ProductCard";
import { formatFrameShape, formatMaterial, cn } from "@/lib/utils";
import { useDiscount } from "@/hooks/useDiscount";
import LikeButton from "@/components/products/LikeButton";

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

interface ProductDrawerProps {
  isOpen: boolean;
  product: Product | SafeProduct | null;
  onClose: () => void;
  onAddLenses?: (product: Product | SafeProduct) => void;
  onAddToCart?: (product: Product | SafeProduct) => void;
}

export default function ProductDrawer({
  isOpen,
  product,
  onClose,
  onAddLenses,
  onAddToCart,
}: ProductDrawerProps) {
  const { getPricing } = useDiscount();
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);

  // Reset selected image index when product changes
  useEffect(() => {
    setSelectedImgIdx(0);
  }, [product?.id]);

  // Handle ESC key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!product) return null;

  const pricing = getPricing(product.price);

  // Parse images
  const getImages = (): string[] => {
    let list: string[] = [];
    const rawImages = product.images;
    if (Array.isArray(rawImages)) {
      list = rawImages;
    } else if (typeof rawImages === "string") {
      const trimmed = rawImages.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else {
        list = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const fallbackImg =
      "image" in product && typeof (product as { image?: string }).image === "string"
        ? (product as { image?: string }).image
        : undefined;

    if (list.length === 0 && fallbackImg) list = [fallbackImg];

    const clean = list.filter((img) => img && img !== "/logo.png" && img !== "");
    return clean.length > 0 ? clean : ["/placeholder-frame.png"];
  };

  const images = getImages();
  const activeImage = images[selectedImgIdx % images.length] || images[0];

  // Parse colors
  const getColors = (): string[] => {
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

  const colors = getColors();
  const isEyeglasses = product.category === "EYEGLASSES" || !product.category;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end transition-visibility duration-300",
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      )}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Slide-over sheet */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between z-10 transform transition-transform duration-300 ease-out sm:border-l sm:border-neutral-200",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ============================================================ */}
        {/*  1. HEADER SECTION                                           */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="inline-block text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase">
              {product.category || "Eyeglasses"}
            </span>
            {pricing.hasDiscount && pricing.badgeText && (
              <span className="bg-neutral-900 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
                {pricing.badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LikeButton productId={product.id} size="sm" />
            <button
              onClick={onClose}
              type="button"
              aria-label="Close drawer"
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  2. SCROLLABLE BODY CONTENT                                  */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 scrollbar-none">
          {/* High-res Framed Image Preview Container */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full bg-neutral-50 rounded-2xl border border-neutral-200/70 p-4 flex items-center justify-center overflow-hidden group">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                quality={95}
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                  <span className="bg-rose-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Gallery / Variant Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIdx(idx)}
                    className={cn(
                      "relative w-16 h-12 rounded-xl border overflow-hidden shrink-0 transition-all bg-neutral-50 cursor-pointer",
                      selectedImgIdx === idx
                        ? "border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs scale-105"
                        : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} preview ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Name, Price, and Description */}
          <div className="space-y-2 border-b border-neutral-100 pb-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-snug">
                {product.name}
              </h2>
            </div>

            {/* Formatted Price */}
            <div className="flex items-baseline gap-2.5 pt-1">
              <span className="text-2xl font-black text-neutral-900">
                {pricing.formattedFinalPrice}
              </span>
              {pricing.hasDiscount && pricing.formattedOriginalPrice && (
                <span className="text-sm font-semibold text-neutral-400 line-through">
                  {pricing.formattedOriginalPrice}
                </span>
              )}
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                In Stock & Ready to Ship
              </span>
            </div>

            {product.description && (
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="space-y-2.5 border-b border-neutral-100 pb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Available Colors ({colors.length})
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {colors.map((c, i) => {
                  const hex = COLOR_MAP[c.toLowerCase()] || c;
                  const isSelected = selectedImgIdx === i % images.length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImgIdx(i % images.length)}
                      className={cn(
                        "group flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="capitalize">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specs & Frame Geometry */}
          <div className="space-y-3 border-b border-neutral-100 pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Frame Specifications
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                <span className="text-neutral-400 font-medium block">Frame Shape</span>
                <span className="text-neutral-900 font-bold block">
                  {formatFrameShape(product.frameShape)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                <span className="text-neutral-400 font-medium block">Material</span>
                <span className="text-neutral-900 font-bold block">
                  {formatMaterial(product.material)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                <span className="text-neutral-400 font-medium block">Gender</span>
                <span className="text-neutral-900 font-bold block capitalize">
                  {product.gender || "Unisex"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                <span className="text-neutral-400 font-medium block">Fit & Comfort</span>
                <span className="text-neutral-900 font-bold block">
                  Ergonomic Asian Fit
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badges & Guarantees */}
          <div className="space-y-2.5 bg-neutral-50/80 rounded-2xl p-4 border border-neutral-200/60">
            <div className="flex items-center gap-3 text-xs text-neutral-700">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Fast Nationwide Delivery</strong> (Rs. 250 Flat across Pakistan)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-700">
              <Glasses className="w-4 h-4 text-neutral-900 shrink-0" />
              <span>
                <strong>Custom Prescription Lenses</strong> (Single Vision, Bifocal, Blue-Cut)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>7-Day Optical Guarantee</strong> &amp; 100% Number Accuracy
              </span>
            </div>
          </div>

          {/* Link to Full Standalone Page */}
          <div className="text-center pt-1">
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:underline transition-colors"
            >
              <span>View full product page with detailed reviews</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  3. STICKY BOTTOM ACTION FOOTER                              */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-white sticky bottom-0 z-20 shadow-lg">
          {product.stock <= 0 ? (
            <button
              disabled
              className="w-full h-12 rounded-xl bg-neutral-100 text-neutral-400 text-sm font-bold cursor-not-allowed border border-neutral-200 flex items-center justify-center"
            >
              Out of Stock
            </button>
          ) : isEyeglasses ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAddLenses) onAddLenses(product);
              }}
              className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Glasses className="w-4 h-4" />
              <span>Select Lenses &amp; Buy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAddToCart) onAddToCart(product);
              }}
              className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sun className="w-4 h-4" />
              <span>Add to Cart ({pricing.formattedFinalPrice})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
