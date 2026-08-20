"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import {
  LENS_PACKAGES,
  LensPackageDefinition,
  calculateLensThickness,
  calculateLensPrice,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/prescription-pricing";
import { formatPrice } from "@/lib/utils";

export interface LensThicknessSimulatorProps {
  onSelectPackage?: (pkg: LensPackageDefinition) => void;
  className?: string;
  isModal?: boolean;
}

export default function LensThicknessSimulator({
  onSelectPackage,
  className = "",
  isModal = false,
}: LensThicknessSimulatorProps) {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);
  const [mode, setMode] = useState<"minus" | "plus">("minus");
  const [power, setPower] = useState<number>(-2.50);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("sv-156-bluecut");

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

  // Compute live price and thickness for each of the 5 exact packages
  const packagesWithLiveCalculations = useMemo(() => {
    return LENS_PACKAGES.map((pkg) => {
      const { center, edge } = calculateLensThickness(power, pkg.indexNumber);
      const priceResult = calculateLensPrice({
        packageId: pkg.id,
        sph: power,
        cyl: 0,
        basePrices,
      });

      const calculatedPrice = priceResult
        ? priceResult.finalPrice
        : basePrices[pkg.baseKey];

      // Recommendation logic: for higher diopters (> 3.50), highlight 1.67 Ultra-Thin
      const isRecommended =
        absPower > 3.50 ? pkg.id === "sv-167-shmc" : pkg.id === "sv-156-bluecut";

      return {
        ...pkg,
        centerThicknessMm: center,
        edgeThicknessMm: edge,
        calculatedPrice,
        isRecommended,
      };
    });
  }, [power, absPower, basePrices]);

  const activePackage = useMemo(() => {
    return (
      packagesWithLiveCalculations.find((p) => p.id === selectedPackageId) ||
      packagesWithLiveCalculations[1]
    );
  }, [packagesWithLiveCalculations, selectedPackageId]);

  return (
    <section
      className={`w-full bg-white ${
        isModal ? "py-4" : "py-16 md:py-24 border-t border-slate-100"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        {!isModal && (
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-2 block">
              LENS PREVIEW
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              See Your Lens Thickness &amp; Price
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Slide your eye power below to compare lens thickness, weight, and exact prices before ordering.
            </p>
          </div>
        )}

        {/* Minimalist Controls & Toggles (All Light Theme) */}
        <div className="max-w-3xl mx-auto bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Segmented Mode Toggle (Distance vs Reading) */}
            <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleModeChange("minus")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === "minus"
                    ? "bg-white text-[#ff7a00] shadow-xs border border-orange-200"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                Distance / Minus (-)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("plus")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === "plus"
                    ? "bg-white text-[#ff7a00] shadow-xs border border-orange-200"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                Reading / Plus (+)
              </button>
            </div>

            {/* Power Stepper Badge */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                YOUR POWER:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepPower(-0.25)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#ff7a00] hover:bg-orange-50 border border-slate-200 transition-colors cursor-pointer text-sm font-bold"
                  aria-label="Decrease power"
                >
                  -
                </button>
                <span className="font-mono text-base font-bold text-slate-900 min-w-[65px] text-center">
                  {power > 0 ? `+${power.toFixed(2)}` : power.toFixed(2)} D
                </span>
                <button
                  type="button"
                  onClick={() => stepPower(0.25)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#ff7a00] hover:bg-orange-50 border border-slate-200 transition-colors cursor-pointer text-sm font-bold"
                  aria-label="Increase power"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Minimal Continuous Slider */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-medium text-slate-400 text-center block mb-2">
              Slide to adjust your eye power
            </span>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>{mode === "minus" ? "-8.00 D" : "0.00 D"}</span>
              <span className="text-slate-500 font-medium">Drag Slider</span>
              <span>{mode === "minus" ? "0.00 D" : "+6.00 D"}</span>
            </div>
            <input
              type="range"
              min={mode === "minus" ? -8.0 : 0.0}
              max={mode === "minus" ? 0.0 : 6.0}
              step={0.25}
              value={power}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-100 rounded-full border border-slate-200/60 appearance-none cursor-pointer accent-[#ff7a00]"
            />
          </div>
        </div>

        {/* Live Lens Packages & Dynamic Physical Cross-Section Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {packagesWithLiveCalculations.map((pkg) => {
            const isSelected = pkg.id === activePackage.id;
            const { centerThicknessMm, edgeThicknessMm, calculatedPrice, isRecommended } = pkg;

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
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-2 border-[#ff7a00] shadow-sm ring-2 ring-orange-500/10"
                    : isRecommended
                    ? "border border-orange-200 bg-orange-50/20 hover:border-orange-300"
                    : "border border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Header Tag */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#ff7a00] uppercase tracking-wider">
                      Index {pkg.index} · {pkg.badge}
                    </span>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff7a00] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Recommended
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {pkg.description}
                  </p>
                </div>

                {/* Parametric SVG Cross-Section Profile */}
                <div className="relative w-full aspect-[16/9] bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-center p-3 overflow-hidden">
                  <svg
                    viewBox="0 0 180 100"
                    className="w-full h-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id={`lensGrad-${pkg.id}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.10" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.12" />
                      </linearGradient>
                    </defs>

                    {/* Lens Contour Path */}
                    <path
                      d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
                      fill={`url(#lensGrad-${pkg.id})`}
                      stroke={isSelected ? "#ff7a00" : "#64748b"}
                      strokeWidth="2"
                    />

                    {/* Optical Axis Guide */}
                    <line
                      x1="90"
                      y1="10"
                      x2="90"
                      y2="90"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Edge measurement calipers */}
                    <line x1="15" y1={leftTopY} x2="15" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1.5" />
                    <line x1="12" y1={leftTopY} x2="18" y2={leftTopY} stroke="#ff7a00" strokeWidth="1" />
                    <line x1="12" y1={leftBottomY} x2="18" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1" />

                    {/* Center measurement guide */}
                    <line x1="95" y1={topY} x2="95" y2={bottomY} stroke="#38bdf8" strokeWidth="1.5" />
                  </svg>

                  {/* Dimension Callouts */}
                  <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-slate-700 bg-white/95 px-2 py-0.5 rounded border border-slate-200">
                    Edge: ~{edgeThicknessMm} mm
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono font-medium text-slate-500 bg-white/95 px-2 py-0.5 rounded border border-slate-200">
                    Center: ~{centerThicknessMm} mm
                  </div>
                </div>

                {/* Specs & Coating Breakdown */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Coating: <strong className="text-slate-700">{pkg.coating}</strong></span>
                    <span className="font-semibold text-emerald-600">{pkg.reductionTag}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ideal Rx: <strong className="text-slate-600">{pkg.idealRange}</strong> · {pkg.abbeValue}
                  </div>
                </div>

                {/* Live Calculated Price & Action */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                        Live Calculated Price
                      </span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatPrice(calculatedPrice)}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md">
                      Pair Price
                    </span>
                  </div>

                  {onSelectPackage ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPackage(pkg);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected || isRecommended
                          ? "bg-[#ff7a00] hover:bg-[#e56e00] text-white shadow-xs"
                          : "bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-[#ff7a00] border border-slate-200"
                      }`}
                    >
                      <span>Select Package</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href="/eyeglasses"
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
                        isSelected || isRecommended
                          ? "bg-[#ff7a00] hover:bg-[#e56e00] text-white shadow-xs"
                          : "bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-[#ff7a00] border border-slate-200"
                      }`}
                    >
                      <span>Configure This Package &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Optical Studio Trust Note */}
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            All prices and lens parameters are synchronized directly with our live prescription calculation engine. All lenses are custom cut in our optical laboratory to sub-millimeter tolerances.
          </p>
        </div>
      </div>
    </section>
  );
}
