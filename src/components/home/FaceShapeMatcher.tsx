"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice, formatMaterial, formatFrameShape } from "@/lib/utils";
import { ArrowRight, Sparkles, CheckCircle2, Glasses } from "lucide-react";
import LikeButton from "@/components/products/LikeButton";
import { useDiscount } from "@/hooks/useDiscount";

export type FaceShapeId = "oval" | "round" | "square" | "heart";

interface FaceShapeData {
  id: FaceShapeId;
  label: string;
  tagline: string;
  characteristics: string[];
  recommendedFrames: string[];
  stylingPrinciple: string;
  targetShapeKeys: string[];
}

const FACE_SHAPES: FaceShapeData[] = [
  {
    id: "oval",
    label: "Oval",
    tagline: "Balanced face with a soft, rounded jaw",
    characteristics: [
      "Forehead is slightly wider than your chin",
      "Face is slightly longer than it is wide",
      "Soft, high cheekbones",
    ],
    recommendedFrames: [
      "Sharp Geometric",
      "Wide Rectangle",
      "Classic Square",
      "Classic Aviator",
    ],
    stylingPrinciple:
      "Pick frames that are just as wide as or slightly wider than your face.",
    targetShapeKeys: ["RECTANGLE", "GEOMETRIC", "SQUARE", "AVIATOR", "WAYFARER"],
  },
  {
    id: "round",
    label: "Round",
    tagline: "Soft, curved cheeks with equal width and height",
    characteristics: [
      "Face is about as wide as it is long",
      "Soft, rounded jaw with no sharp corners",
      "Fuller, round cheeks",
    ],
    recommendedFrames: [
      "Sharp Rectangle",
      "Wide Square",
      "Geometric Shapes",
      "Classic Wayfarer",
    ],
    stylingPrinciple:
      "Choose angular and rectangular frames to add sharp lines and make your face look slimmer.",
    targetShapeKeys: ["RECTANGLE", "SQUARE", "WAYFARER", "GEOMETRIC"],
  },
  {
    id: "square",
    label: "Square",
    tagline: "Strong, wide jaw with balanced angles",
    characteristics: [
      "Strong, sharp jawline",
      "Forehead, cheeks, and jaw are all the same width",
      "Straight sides with clear lines",
    ],
    recommendedFrames: [
      "Round Frames",
      "Soft Oval",
      "Classic Aviator",
      "Thin Metal Wireframes",
    ],
    stylingPrinciple:
      "Pick round or oval frames to soften strong jawlines and balance your look.",
    targetShapeKeys: ["ROUND", "OVAL", "AVIATOR", "RIMLESS"],
  },
  {
    id: "heart",
    label: "Heart",
    tagline: "Wider forehead with a neat, pointed chin",
    characteristics: [
      "Widest at your forehead and cheekbones",
      "Narrows down gently to your chin",
      "Small, tapered chin",
    ],
    recommendedFrames: [
      "Round Wireframes",
      "Soft Oval",
      "Subtle Cat-Eye",
      "Light Rimless Frames",
    ],
    stylingPrinciple:
      "Pick round or bottom-wider frames to balance your forehead and chin.",
    targetShapeKeys: ["ROUND", "CAT_EYE", "OVAL", "RIMLESS", "AVIATOR"],
  },
];

/* ------------------------------------------------------------------ */
/*  Minimal Geometric Vector Visualizers per Face Shape               */
/* ------------------------------------------------------------------ */
function FaceGeometryWireframe({ shape }: { shape: FaceShapeId }) {
  return (
    <div className="relative w-full aspect-[4/3] max-w-[280px] mx-auto flex items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-slate-900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle grid reference lines */}
        <line x1="100" y1="20" x2="100" y2="180" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

        {shape === "oval" && (
          <g>
            {/* Oval Face Contour */}
            <ellipse cx="100" cy="100" rx="55" ry="72" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            {/* Recommended Angular/Geometric Frame Overlay */}
            <rect x="52" y="80" width="40" height="28" rx="4" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <rect x="108" y="80" width="40" height="28" rx="4" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <path d="M 92 88 Q 100 84 108 88" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="52" y1="88" x2="40" y2="84" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="148" y1="88" x2="160" y2="84" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            {/* Facial reference points */}
            <circle cx="72" cy="94" r="2.5" fill="#64748b" />
            <circle cx="128" cy="94" r="2.5" fill="#64748b" />
          </g>
        )}

        {shape === "round" && (
          <g>
            {/* Round Face Contour */}
            <circle cx="100" cy="100" r="64" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            {/* Recommended Angular Rectangular Frame Overlay */}
            <rect x="50" y="82" width="42" height="24" rx="3" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <rect x="108" y="82" width="42" height="24" rx="3" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <path d="M 92 88 L 108 88" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="88" x2="38" y2="86" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="150" y1="88" x2="162" y2="86" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            {/* Facial reference points */}
            <circle cx="71" cy="94" r="2.5" fill="#64748b" />
            <circle cx="129" cy="94" r="2.5" fill="#64748b" />
          </g>
        )}

        {shape === "square" && (
          <g>
            {/* Square Face Contour */}
            <rect x="42" y="38" width="116" height="124" rx="20" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            {/* Recommended Round/Curved Frame Overlay */}
            <ellipse cx="72" cy="94" rx="22" ry="19" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <ellipse cx="128" cy="94" rx="22" ry="19" stroke="#ff7a00" strokeWidth="2.5" fill="rgba(255,122,0,0.06)" />
            <path d="M 94 90 Q 100 84 106 90" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="90" x2="38" y2="86" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="150" y1="90" x2="162" y2="86" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            {/* Facial reference points */}
            <circle cx="72" cy="94" r="2.5" fill="#64748b" />
            <circle cx="128" cy="94" r="2.5" fill="#64748b" />
          </g>
        )}

        {shape === "heart" && (
          <g>
            {/* Heart Face Contour */}
            <path
              d="M 44,56 C 44,40 156,40 156,56 C 156,92 125,160 100,172 C 75,160 44,92 44,56 Z"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Recommended Bottom-Weighted / Oval Frame Overlay */}
            <path
              d="M 52,80 C 52,74 90,74 90,80 C 90,96 84,110 71,110 C 58,110 52,96 52,80 Z"
              stroke="#ff7a00"
              strokeWidth="2.5"
              fill="rgba(255,122,0,0.06)"
            />
            <path
              d="M 110,80 C 110,74 148,74 148,80 C 148,96 142,110 129,110 C 116,110 110,96 110,80 Z"
              stroke="#ff7a00"
              strokeWidth="2.5"
              fill="rgba(255,122,0,0.06)"
            />
            <path d="M 90 86 Q 100 82 110 86" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="52" y1="84" x2="40" y2="80" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <line x1="148" y1="84" x2="160" y2="80" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            {/* Facial reference points */}
            <circle cx="71" cy="92" r="2.5" fill="#64748b" />
            <circle cx="129" cy="92" r="2.5" fill="#64748b" />
          </g>
        )}
      </svg>
      <span className="absolute bottom-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
        Geometry: {shape}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FaceShapeProductCard Component                                    */
/* ------------------------------------------------------------------ */
export function FaceShapeProductCard({
  product,
  onAddLenses,
}: {
  product: SafeProduct;
  onAddLenses?: (product: SafeProduct) => void;
}) {
  const { getPricing } = useDiscount();
  const pricing = getPricing(product.price);

  const imgUrl =
    product.images && product.images.length > 0 && product.images[0] !== "/logo.png"
      ? product.images[0]
      : "/placeholder-frame.png";

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white hover:shadow-lg transition-all duration-300 group app-card-press">
      {/* 100% Full-width top image container */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden group/img">
        <Link href={`/products/${product.slug}`} className="block absolute inset-0 w-full h-full">
          <Image
            src={imgUrl}
            alt={product.name}
            fill
            quality={90}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Category Pill Badge & Promotional OFF Badge pinned top left */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none flex-wrap max-w-[75%]">
          <span className="bg-[#0F172A]/90 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
            {product.category || "Eyeglasses"}
          </span>
          {pricing.hasDiscount && pricing.badgeText && (
            <span className="bg-neutral-900/90 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
              {pricing.badgeText}
            </span>
          )}
        </div>

        {/* Save / Wishlist Heart Button pinned top right */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <LikeButton productId={product.id} size="sm" />
        </div>
      </div>

      {/* Content Container with isolated padding */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2.5">
        {/* Shape / Subtitle Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{formatFrameShape(product.frameShape)}</span>
          <span>{product.gender || "Unisex"}</span>
        </div>

        {/* Title & Description */}
        <div>
          <Link href={`/products/${product.slug}`}>
            <h5 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#ff7a00] transition-colors">
              {product.name}
            </h5>
          </Link>
          {product.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">
              {pricing.formattedFinalPrice}
            </span>
            {pricing.hasDiscount && pricing.formattedOriginalPrice && (
              <span className="text-neutral-400 text-xs line-through">
                {pricing.formattedOriginalPrice}
              </span>
            )}
          </div>

          {onAddLenses ? (
            <button
              type="button"
              onClick={() => onAddLenses(product)}
              className="h-[32px] px-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Add Lenses</span>
            </button>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="h-[32px] px-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Add Lenses</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
interface FaceShapeMatcherProps {
  products?: SafeProduct[];
  onAddLenses?: (product: SafeProduct) => void;
}

export default function FaceShapeMatcher({
  products = [],
  onAddLenses,
}: FaceShapeMatcherProps) {
  const [selectedShapeId, setSelectedShapeId] = useState<FaceShapeId>("oval");

  const currentShape = useMemo(
    () => FACE_SHAPES.find((s) => s.id === selectedShapeId) || FACE_SHAPES[0],
    [selectedShapeId]
  );

  // Filter actual catalog products matching the shape
  const matchedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // First try exact frame shape keys
    const filtered = products.filter((p) => {
      const pShape = (p.frameShape || "").toUpperCase();
      return currentShape.targetShapeKeys.includes(pShape);
    });

    if (filtered.length >= 2) {
      return filtered.slice(0, 3);
    }

    // If not enough exact matches, fallback to general eyeglasses
    const generalEyeglasses = products.filter((p) => p.category === "EYEGLASSES");
    const combined = [...filtered, ...generalEyeglasses.filter((p) => !filtered.some((f) => f.id === p.id))];
    return combined.slice(0, 3);
  }, [products, currentShape]);

  return (
    <section className="w-full bg-white py-16 sm:py-20 border-t border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-2 block">
            FIND YOUR FIT
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Find the Best Glasses for Your Face Shape
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Pick your face shape below to see which frame styles look best on you.
          </p>
        </div>

        {/* Interactive Face Shape Selector (2x2 Grid on Mobile, Row on Desktop) */}
        <div className="w-full max-w-xl mx-auto">
          <div className="grid grid-cols-2 md:flex md:flex-row md:justify-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-slate-50 border border-slate-200/80">
            {FACE_SHAPES.map((shape) => {
              const isActive = shape.id === selectedShapeId;
              return (
                <button
                  key={shape.id}
                  onClick={() => setSelectedShapeId(shape.id)}
                  className={`w-full md:w-auto px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center border cursor-pointer ${
                    isActive
                      ? "bg-orange-50/50 border-[#ff7a00] text-[#ff7a00] font-semibold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <span>{shape.label} Shape</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Responsive Diagnostic Stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentShape.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
          >
            {/* Left Panel: Optical Styling Guidance (~45% / 5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Wireframe Graphic */}
              <FaceGeometryWireframe shape={currentShape.id} />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {currentShape.label} Face Shape
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentShape.tagline}
                  </p>
                </div>

                {/* Characteristics */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    How to tell if this is you:
                  </span>
                  <ul className="space-y-1.5">
                    {currentShape.characteristics.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Frame Silhouettes */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Best Glasses Shapes for You
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentShape.recommendedFrames.map((frame, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200/60"
                      >
                        {frame}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Optical Styling Rule */}
                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-orange-900 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Styling Tip</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {currentShape.stylingPrinciple}
                  </p>
                </div>

                {/* Contextual Quiz CTA */}
                <div className="pt-2">
                  <Link
                    href="/quiz"
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-[#ff7a00] hover:text-amber-700 transition-colors"
                  >
                    <span>Not sure about your face shape? Take our quick 1-minute quiz</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Panel: Live Dynamic Catalog Stream (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Frames That Fit Your Face
                  </h4>
                  <p className="text-xs text-slate-500">
                    Handcrafted styles chosen for {currentShape.label.toLowerCase()} faces
                  </p>
                </div>
                <Link
                  href="/eyeglasses"
                  className="text-xs font-semibold text-slate-600 hover:text-[#ff7a00] transition-colors"
                >
                  View All Frames &rarr;
                </Link>
              </div>

              {matchedProducts.length === 0 ? (
                <div className="p-12 text-center border border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Loading verified optical frames...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {matchedProducts.map((product) => (
                    <FaceShapeProductCard
                      key={product.id}
                      product={product}
                      onAddLenses={onAddLenses}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
