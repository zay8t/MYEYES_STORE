"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import {
  LENS_PACKAGES,
  LensPackageDefinition,
  calculateLensThickness,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/prescription-pricing";
import { calculateTotalLensPrice } from "@/lib/pricingEngine";
import { formatPrice } from "@/lib/utils";

export interface LensThicknessSimulatorProps {
  odSph?: number | string;
  osSph?: number | string;
  odCyl?: number | string;
  osCyl?: number | string;
  selectedPackageId?: string;
  onSelectPackage?: (pkg: LensPackageDefinition) => void;
  className?: string;
  isModal?: boolean;
}

function formatDiopter(val: number | string | undefined): string {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0)) || 0;
  if (num === 0) return "+0.00";
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

export default function LensThicknessSimulator({
  odSph = "-2.00",
  osSph = "-2.00",
  odCyl = "0.00",
  osCyl = "0.00",
  selectedPackageId = "sv-156-bluecut",
  onSelectPackage,
  className = "",
  isModal = false,
}: LensThicknessSimulatorProps) {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);

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

  const parsedOdSph = typeof odSph === "number" ? odSph : parseFloat(String(odSph || 0)) || 0;
  const parsedOsSph = typeof osSph === "number" ? osSph : parseFloat(String(osSph || 0)) || 0;
  const parsedOdCyl = typeof odCyl === "number" ? odCyl : parseFloat(String(odCyl || 0)) || 0;
  const parsedOsCyl = typeof osCyl === "number" ? osCyl : parseFloat(String(osCyl || 0)) || 0;

  // Use dominant magnitude to drive physical cross-section rendering
  const dominantSph =
    Math.abs(parsedOdSph) >= Math.abs(parsedOsSph) ? parsedOdSph : parsedOsSph;
  const maxAbsSph = Math.max(Math.abs(parsedOdSph), Math.abs(parsedOsSph));

  // Compute live price and thickness for each of the 5 exact packages
  const packagesWithCalculations = useMemo(() => {
    return LENS_PACKAGES.map((pkg) => {
      const { center, edge } = calculateLensThickness(dominantSph, pkg.indexNumber);

      const priceResult = calculateTotalLensPrice(
        pkg.id,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        basePrices
      );

      const calculatedPrice = priceResult
        ? priceResult.finalPrice
        : basePrices[pkg.baseKey];

      // Auto-recommendation logic:
      // High prescriptions (> 3.50 D) recommend Option 5 Ultra-Thin Index
      // Standard prescriptions recommend Option 2 Blue Light Filter HMC
      const isRecommended =
        maxAbsSph > 3.50 ? pkg.id === "sv-167-shmc" : pkg.id === "sv-156-bluecut";

      const isSelected = selectedPackageId === pkg.id;

      return {
        ...pkg,
        centerThicknessMm: center,
        edgeThicknessMm: edge,
        calculatedPrice,
        isRecommended,
        isSelected,
      };
    });
  }, [
    dominantSph,
    maxAbsSph,
    parsedOdSph,
    parsedOsSph,
    parsedOdCyl,
    parsedOsCyl,
    selectedPackageId,
    basePrices,
  ]);

  return (
    <div className={`w-full bg-white ${isModal ? "py-2" : "pt-8 pb-4"} ${className}`}>
      <div className="space-y-8">
        {/* Header & Live RX Callout */}
        <div className="space-y-4">
          {!isModal && (
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-1.5 block">
                PHYSICAL LENS THICKNESS PREVIEW
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Compare Lens Thickness for Your Prescription
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time optical cross-sections and thickness metrics automatically synchronized with your entered numbers.
              </p>
            </div>
          )}

          {/* Dynamic Prescription Indicator Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff7a00]" />
              <span className="font-semibold text-slate-700">
                Live Rx Parameters:
              </span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                OD: {formatDiopter(parsedOdSph)} SPH {parsedOdCyl !== 0 ? `| ${formatDiopter(parsedOdCyl)} CYL` : ""}
              </span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                OS: {formatDiopter(parsedOsSph)} SPH {parsedOsCyl !== 0 ? `| ${formatDiopter(parsedOsCyl)} CYL` : ""}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Modeling Core: <strong className="text-[#ff7a00] font-bold font-mono">{formatDiopter(dominantSph)} D</strong>
            </span>
          </div>
        </div>

        {/* 5 Exact Packages Dynamic Physical Cross-Section Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {packagesWithCalculations.map((pkg) => {
            const {
              centerThicknessMm,
              edgeThicknessMm,
              calculatedPrice,
              isRecommended,
              isSelected,
            } = pkg;

            // Parametric SVG Curve Heights
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
                className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-[#ff7a00] shadow-sm ring-4 ring-orange-500/10"
                    : isRecommended
                    ? "border border-orange-200 bg-orange-50/20 hover:border-orange-300"
                    : "border border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Header Info */}
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
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {pkg.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {pkg.description}
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
                      <linearGradient
                        id={`grad-${pkg.id}`}
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

                    {/* Lens Cross-section Profile */}
                    <path
                      d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
                      fill={`url(#grad-${pkg.id})`}
                      stroke={isSelected || isRecommended ? "#ff7a00" : "#64748b"}
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

                    {/* Caliper Markers */}
                    <line x1="15" y1={leftTopY} x2="15" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1.5" />
                    <line x1="12" y1={leftTopY} x2="18" y2={leftTopY} stroke="#ff7a00" strokeWidth="1" />
                    <line x1="12" y1={leftBottomY} x2="18" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1" />
                    <line x1="95" y1={topY} x2="95" y2={bottomY} stroke="#38bdf8" strokeWidth="1.5" />
                  </svg>

                  {/* Absolute Measurement Callouts */}
                  <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-slate-700 bg-white/95 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Edge: ~{edgeThicknessMm} mm
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono font-medium text-slate-500 bg-white/95 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Center: ~{centerThicknessMm} mm
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Coating: <strong className="text-slate-700">{pkg.coating}</strong></span>
                    <span className="font-semibold text-emerald-600">{pkg.reductionTag}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ideal Range: <strong className="text-slate-600">{pkg.idealRange}</strong> · {pkg.abbeValue}
                  </div>
                </div>

                {/* Price & Action */}
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
                      onClick={() => onSelectPackage(pkg)}
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

        {/* Lab Quality Assurance Guarantee */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            All prices and lens parameters are synchronized directly with our live prescription calculation engine. All lenses are custom cut in our optical laboratory to sub-millimeter tolerances.
          </p>
        </div>
      </div>
    </div>
  );
}
