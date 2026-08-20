"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice, formatMaterial } from "@/lib/utils";
import { ArrowRight, Sparkles, CheckCircle2, Glasses } from "lucide-react";

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
    tagline: "Naturally balanced facial geometry with softly curved jawline",
    characteristics: [
      "Forehead is slightly wider than curved jaw",
      "Balanced facial length to width ratio (1.5 : 1)",
      "High, softly rounded cheekbone contours",
    ],
    recommendedFrames: [
      "Geometric & Architectural",
      "Wide Rectangular",
      "Classic Square",
      "Teardrop Aviator",
    ],
    stylingPrinciple:
      "Maintain natural facial equilibrium with frames that are as wide as or slightly wider than the broadest part of your face.",
    targetShapeKeys: ["RECTANGLE", "GEOMETRIC", "SQUARE", "AVIATOR", "WAYFARER"],
  },
  {
    id: "round",
    label: "Round",
    tagline: "Soft circular curves with equal width and cheek fullness",
    characteristics: [
      "Equal facial width and vertical height",
      "Soft, curved jawline without sharp angularity",
      "Fuller cheek contours creating youthful softness",
    ],
    recommendedFrames: [
      "Angular Rectangular",
      "Deep Square Frames",
      "Sharp Geometric Silhouettes",
      "Structured Wayfarers",
    ],
    stylingPrinciple:
      "Introduce sharp, angular contours and rectangular lines to visually elongate facial symmetry and add architectural definition.",
    targetShapeKeys: ["RECTANGLE", "SQUARE", "WAYFARER", "GEOMETRIC"],
  },
  {
    id: "square",
    label: "Square",
    tagline: "Strong horizontal jawline with bold, architectural symmetry",
    characteristics: [
      "Distinct, chiseled horizontal jawline",
      "Forehead, cheekbones, and jaw are equal width",
      "Straight, defined vertical facial edges",
    ],
    recommendedFrames: [
      "Round Optical Silhouettes",
      "Soft Oval Frames",
      "Teardrop Aviators",
      "Ultra-thin Curved Wireframes",
    ],
    stylingPrinciple:
      "Soften chiseled jaw angles with circular, oval, and curved rim profiles that sit higher on the nasal bridge.",
    targetShapeKeys: ["ROUND", "OVAL", "AVIATOR", "RIMLESS"],
  },
  {
    id: "heart",
    label: "Heart",
    tagline: "Broad forehead tapering gracefully to an inverted triangular chin",
    characteristics: [
      "Widest at browline and high cheekbones",
      "Tapers delicately downward to a pointed chin",
      "Delicate, sculpted lower facial geometry",
    ],
    recommendedFrames: [
      "Bottom-Heavy Oval Frames",
      "Curved Round Wireframes",
      "Subtle Cat-Eye Accents",
      "Lightweight Rimless Designs",
    ],
    stylingPrinciple:
      "Balance brow width and delicate chin proportions using frames with low-sitting bridges and bottom-weighted curvature.",
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
    <section className="w-full bg-white py-16 md:py-24 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-2 block">
            PRECISION FIT SYSTEM
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Curated Optics for Your Facial Geometry
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Select your face silhouette to unlock optically balanced frame geometries and tailored styling recommendations.
          </p>
        </div>

        {/* Interactive Face Shape Selector (Pill Tabs) */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 gap-1.5 sm:gap-2 max-w-full overflow-x-auto">
            {FACE_SHAPES.map((shape) => {
              const isActive = shape.id === selectedShapeId;
              return (
                <button
                  key={shape.id}
                  onClick={() => setSelectedShapeId(shape.id)}
                  className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-orange-950 font-semibold border border-[#ff7a00] bg-orange-50/50 shadow-xs"
                      : "text-slate-600 font-medium border border-transparent hover:text-slate-900 hover:bg-white"
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
                    {currentShape.label} Facial Silhouette
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentShape.tagline}
                  </p>
                </div>

                {/* Characteristics */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Facial Characteristics
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
                    Recommended Frame Silhouettes
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
                    <span>Optical Fitting Rule</span>
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
                    <span>Uncertain of your facial geometry? Take the 60-Second Fit Quiz</span>
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
                    Optically Matched Inventory
                  </h4>
                  <p className="text-xs text-slate-500">
                    Handcrafted frames balanced for {currentShape.label} geometry
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {matchedProducts.map((product) => {
                    const imgUrl =
                      product.images && product.images.length > 0 && product.images[0] !== "/logo.png"
                        ? product.images[0]
                        : "/placeholder-frame.png";

                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.98]"
                      >
                        <Link
                          href={`/products/${product.slug}`}
                          className="block relative w-full aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden group"
                        >
                          <Image
                            src={imgUrl}
                            alt={product.name}
                            fill
                            quality={85}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs border border-slate-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-slate-700">
                            {formatMaterial(product.material)}
                          </span>
                        </Link>

                        <div className="space-y-1">
                          <Link href={`/products/${product.slug}`}>
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-[#ff7a00] transition-colors">
                              {product.name}
                            </h5>
                          </Link>
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="font-extrabold text-slate-900">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {product.formattedShape || "Classic"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {onAddLenses ? (
                            <button
                              type="button"
                              onClick={() => onAddLenses(product)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Glasses className="w-3.5 h-3.5" />
                              <span>Configure Rx</span>
                            </button>
                          ) : (
                            <Link
                              href={`/products/${product.slug}`}
                              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                            >
                              <Glasses className="w-3.5 h-3.5" />
                              <span>Select Frame</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
