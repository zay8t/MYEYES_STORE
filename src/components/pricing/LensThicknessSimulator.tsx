"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import {
  calculateSingleEyePrice,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/pricingEngine";
import { formatPrice } from "@/lib/utils";

export interface LensThicknessSimulatorProps {
  onSelectIndex?: (indexVal: "1.56" | "1.61" | "1.67") => void;
  className?: string;
  isModal?: boolean;
}

// Pure non-recursive mathematical sagitta calculation
export function calculateLensThickness(
  sph: number,
  index: number
): { center: number; edge: number } {
  const absSph = Math.abs(sph);
  const radius = 26; // standard lens blank half-diameter in mm
  const sag = (radius * radius * absSph) / (2000 * (index - 1));

  if (sph <= 0) {
    // Myopia (Concave): fixed center, edge grows
    const center = 1.5;
    const edge = Number((center + sag).toFixed(1));
    return { center, edge };
  } else {
    // Hyperopia (Convex): fixed edge, center grows
    const edge = 1.2;
    const center = Number((edge + sag).toFixed(1));
    return { center, edge };
  }
}

export default function LensThicknessSimulator({
  onSelectIndex,
  className = "",
  isModal = false,
}: LensThicknessSimulatorProps) {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);
  const [mode, setMode] = useState<"minus" | "plus">("minus");
  const [power, setPower] = useState<number>(-2.50);

  // Fetch real-time active base prices from the database / API
  useEffect(() => {
    let isMounted = true;
    async function loadPrices() {
      try {
        const res = await fetch("/api/base-prices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBasePrices(data);
        }
      } catch (err) {
        console.warn("Using default base prices for thickness simulator:", err);
      }
    }
    loadPrices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleModeChange = (newMode: "minus" | "plus") => {
    setMode(newMode);
    if (newMode === "minus" && power > 0) {
      setPower(-Math.abs(power));
    } else if (newMode === "plus" && power < 0) {
      setPower(Math.min(6.0, Math.abs(power)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPower(val);
  };

  const stepPower = (delta: number) => {
    const min = mode === "minus" ? -8.0 : 0.0;
    const max = mode === "minus" ? 0.0 : 6.0;
    setPower((prev) => {
      const next = Math.round((prev + delta) * 4) / 4;
      return Math.min(max, Math.max(min, next));
    });
  };

  const absPower = Math.abs(power);

  const calculateSpecs = (n: number, indexId: "1.56" | "1.61" | "1.67") => {
    const { center, edge } = calculateLensThickness(power, n);

    let dynamicPrice = 0;
    if (indexId === "1.56") {
      const p = calculateSingleEyePrice("sv-156-bluecut", power, 0, basePrices);
      dynamicPrice = p ? p.finalPrice : basePrices.B2;
    } else if (indexId === "1.61") {
      const p156 = calculateSingleEyePrice("sv-156-bluecut", power, 0, basePrices);
      const p167 = calculateSingleEyePrice("sv-167-shmc", power, 0, basePrices);
      const base156 = p156 ? p156.finalPrice : basePrices.B2;
      const base167 = p167 ? p167.finalPrice : basePrices.B5;
      dynamicPrice = Math.round((base156 + base167) / 2);
    } else if (indexId === "1.67") {
      const p = calculateSingleEyePrice("sv-167-shmc", power, 0, basePrices);
      dynamicPrice = p ? p.finalPrice : basePrices.B5;
    }

    return {
      centerThicknessMm: center,
      edgeThicknessMm: edge,
      dynamicPrice,
    };
  };

  const specs156 = useMemo(() => calculateSpecs(1.56, "1.56"), [power, basePrices]);
  const specs161 = useMemo(() => calculateSpecs(1.61, "1.61"), [power, basePrices]);
  const specs167 = useMemo(() => calculateSpecs(1.67, "1.67"), [power, basePrices]);

  const recommendedIndex = useMemo(() => {
    if (absPower <= 2.0) return "1.56";
    if (absPower <= 4.0) return "1.61";
    return "1.67";
  }, [absPower]);

  const indexData = [
    {
      index: "1.56",
      name: "1.56 Standard Clear",
      badge: "Everyday Standard",
      idealRange: "0.00 D to ±2.00 D",
      abbeValue: "Abbe 38 (High Clarity)",
      characteristics: "High Abbe value with crystal optical clarity. Standard thickness for mild prescriptions.",
      specs: specs156,
      reductionTag: "Base Baseline",
    },
    {
      index: "1.61",
      name: "1.61 High-Index Slim",
      badge: "20% Slimmer Profile",
      idealRange: "±2.25 D to ±4.00 D",
      abbeValue: "Abbe 42 (High Tensile)",
      characteristics: "20% thinner and significantly lighter. Ideal for thin metal, acetate, and semi-rimless frames.",
      specs: specs161,
      reductionTag: "20% Thinner",
    },
    {
      index: "1.67",
      name: "1.67 Ultra-Thin Aspheric",
      badge: "35% Ultra-Flat Aspheric",
      idealRange: "±4.25 D to ±8.00 D+",
      abbeValue: "Abbe 32 (Flattest Curve)",
      characteristics: "35% flatter aspheric profile. Eliminates eye magnification and heavy edge distortion.",
      specs: specs167,
      reductionTag: "35% Thinner",
    },
  ];

  return (
    <section className={`w-full bg-white ${isModal ? "py-4" : "py-16 md:py-24 border-t border-slate-100"} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        {!isModal && (
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-2 block">
              OPTICAL PRECISION ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Interactive Lens Thickness &amp; Index Simulator
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Adjust your prescription power to preview physical lens profiles, edge thicknesses, and index advantages in real time.
            </p>
          </div>
        )}

        {/* Diopter Controls Card */}
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mode Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 text-xs shadow-2xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleModeChange("minus")}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === "minus"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Nearsighted / Myopia (- SPH)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("plus")}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === "plus"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Farsighted / Hyperopia (+ SPH)
              </button>
            </div>

            {/* Stepper + Value Display */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Prescription:
              </span>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => stepPower(mode === "minus" ? -0.25 : -0.25)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="font-mono text-base font-bold text-slate-900 min-w-[70px] text-center">
                  {power > 0 ? `+${power.toFixed(2)}` : power.toFixed(2)} D
                </span>
                <button
                  type="button"
                  onClick={() => stepPower(mode === "minus" ? 0.25 : 0.25)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Continuous Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>{mode === "minus" ? "-8.00 D" : "0.00 D"}</span>
              <span className="text-slate-600 font-medium">Drag Slider to Calibrate</span>
              <span>{mode === "minus" ? "0.00 D" : "+6.00 D"}</span>
            </div>
            <input
              type="range"
              min={mode === "minus" ? -8.0 : 0.0}
              max={mode === "minus" ? 0.0 : 6.0}
              step={0.25}
              value={power}
              onChange={handleSliderChange}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff7a00]"
            />
          </div>
        </div>

        {/* Dynamic 3-Index Comparative Cross-Section Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {indexData.map((item) => {
            const isRecommended = item.index === recommendedIndex;
            const { centerThicknessMm, edgeThicknessMm, dynamicPrice } = item.specs;

            const visualEdgeH = Math.min(36, Math.max(6, edgeThicknessMm * 4.5));
            const visualCenterH = Math.min(36, Math.max(6, centerThicknessMm * 4.5));

            const topY = 50 - visualCenterH / 2;
            const bottomY = 50 + visualCenterH / 2;
            const leftTopY = 50 - visualEdgeH / 2;
            const leftBottomY = 50 + visualEdgeH / 2;
            const rightTopY = 50 - visualEdgeH / 2;
            const rightBottomY = 50 + visualEdgeH / 2;

            return (
              <div
                key={item.index}
                className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 ${
                  isRecommended
                    ? "border-2 border-[#ff7a00] shadow-md ring-4 ring-orange-500/10"
                    : "border border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Header Tag */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#ff7a00] uppercase tracking-wider">
                      Index {item.index}
                    </span>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#ff7a00] px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Recommended
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ideal Rx: <strong className="text-slate-700">{item.idealRange}</strong>
                  </p>
                </div>

                {/* Parametric SVG Visualizer */}
                <div className="relative w-full aspect-[16/9] bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-center p-3 overflow-hidden">
                  <svg
                    viewBox="0 0 180 100"
                    className="w-full h-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={`lensGrad-${item.index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.12" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.16" />
                      </linearGradient>
                    </defs>

                    {/* Lens Cross-section Profile */}
                    <path
                      d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
                      fill={`url(#lensGrad-${item.index})`}
                      stroke={isRecommended ? "#ff7a00" : "#64748b"}
                      strokeWidth="2"
                    />

                    {/* Optical Axis Center Guide */}
                    <line
                      x1="90"
                      y1="10"
                      x2="90"
                      y2="90"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Edge thickness measurement marker */}
                    <line x1="15" y1={leftTopY} x2="15" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1.5" />
                    <line x1="12" y1={leftTopY} x2="18" y2={leftTopY} stroke="#ff7a00" strokeWidth="1" />
                    <line x1="12" y1={leftBottomY} x2="18" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1" />

                    {/* Center thickness measurement marker */}
                    <line x1="95" y1={topY} x2="95" y2={bottomY} stroke="#38bdf8" strokeWidth="1.5" />
                  </svg>

                  {/* Absolute Badge Markers */}
                  <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                    Edge: ~{edgeThicknessMm} mm
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono font-medium text-slate-500 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                    Center: ~{centerThicknessMm} mm
                  </div>
                </div>

                {/* Characteristics & Specs */}
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="leading-relaxed font-normal">{item.characteristics}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 border-t border-slate-100">
                    <span>{item.abbeValue}</span>
                    <span className="font-semibold text-emerald-600">{item.reductionTag}</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                        Estimated Pair Price
                      </span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatPrice(dynamicPrice)}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      Lab-Edged
                    </span>
                  </div>

                  {onSelectIndex ? (
                    <button
                      type="button"
                      onClick={() => onSelectIndex(item.index as "1.56" | "1.61" | "1.67")}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isRecommended
                          ? "bg-[#ff7a00] hover:bg-[#e56e00] text-white shadow-xs"
                          : "bg-slate-900 hover:bg-black text-white"
                      }`}
                    >
                      <span>Select {item.index} Index</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href="/eyeglasses"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
                        isRecommended
                          ? "bg-[#ff7a00] hover:bg-[#e56e00] text-white shadow-xs"
                          : "bg-slate-900 hover:bg-black text-white"
                      }`}
                    >
                      <span>Configure Prescription &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Optical Studio Trust Note */}
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            All lenses are custom edged using state-of-the-art CNC diamond wheels in our laboratory to guarantee exact optical center (OC) placement and sub-millimeter tolerances.
          </p>
        </div>
      </div>
    </section>
  );
}
