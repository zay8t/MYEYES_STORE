"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Check, Lightbulb, Zap } from "lucide-react";
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

  // Selected package from the 5 official packages
  const activePackage = useMemo(() => {
    const found = LENS_PACKAGES.find((p) => p.id === selectedPackageId);
    return found || LENS_PACKAGES[1]; // default to Blue Cut
  }, [selectedPackageId]);

  // Dominant eye calculations (considering spherical equivalent: SPH + 0.5 * CYL)
  const absOdSph = Math.abs(parsedOdSph);
  const absOsSph = Math.abs(parsedOsSph);
  const maxAbsSph = Math.max(absOdSph, absOsSph);
  const dominantSph = absOdSph >= absOsSph ? parsedOdSph : parsedOsSph;
  const dominantCyl = absOdSph >= absOsSph ? parsedOdCyl : parsedOsCyl;
  
  // Spherical equivalent power for accurate optical thickness
  const effectiveDiopter = maxAbsSph + 0.5 * Math.abs(dominantCyl);
  const signedEffectiveDiopter = dominantSph <= 0 ? -effectiveDiopter : effectiveDiopter;

  // Real-time thickness calculations for the chosen package
  const { center, edge } = useMemo(() => {
    return calculateLensThickness(signedEffectiveDiopter, activePackage.indexNumber);
  }, [signedEffectiveDiopter, activePackage.indexNumber]);

  // Comparison specs for 1.67 ultra thin to compute reduction percentage
  const specs167 = useMemo(() => {
    return calculateLensThickness(signedEffectiveDiopter, 1.67);
  }, [signedEffectiveDiopter]);

  // Live pair pricing calculation
  const calculatedPrice = useMemo(() => {
    const res = calculateTotalLensPrice(
      activePackage.id,
      { sph: parsedOdSph, cyl: parsedOdCyl },
      { sph: parsedOsSph, cyl: parsedOsCyl },
      basePrices
    );
    return res ? res.finalPrice : basePrices[activePackage.baseKey];
  }, [activePackage, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, basePrices]);

  // High-diopter condition: |SPH| >= 4.00 D
  const isHighDiopter = maxAbsSph >= 4.00;
  const is156Index = activePackage.index === "1.56";

  // SVG Parametric Curve Heights
  const visualEdgeH = Math.min(38, Math.max(6, edge * 4.5));
  const visualCenterH = Math.min(38, Math.max(6, center * 4.5));

  const topY = 50 - visualCenterH / 2;
  const bottomY = 50 + visualCenterH / 2;
  const leftTopY = 50 - visualEdgeH / 2;
  const leftBottomY = 50 + visualEdgeH / 2;
  const rightTopY = 50 - visualEdgeH / 2;
  const rightBottomY = 50 + visualEdgeH / 2;

  const ultraThinPackage = LENS_PACKAGES.find((p) => p.id === "sv-167-shmc");

  return (
    <div className={`w-full bg-white ${isModal ? "py-2" : "pt-8 pb-4"} ${className}`}>
      <div className="space-y-6">
        {/* Header & Live RX Callout */}
        {!isModal && (
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-1.5 block">
              PHYSICAL LENS THICKNESS PREVIEW
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Your Selected Lens Profile &amp; Thickness
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Dynamically rendered cross-section and thickness metrics for your active prescription and chosen package.
            </p>
          </div>
        )}

        {/* Dynamic Prescription Indicator Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00]" />
            <span className="font-semibold text-slate-700">
              Active Parameters:
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              OD: {formatDiopter(parsedOdSph)} SPH {parsedOdCyl !== 0 ? `| ${formatDiopter(parsedOdCyl)} CYL` : ""}
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              OS: {formatDiopter(parsedOsSph)} SPH {parsedOsCyl !== 0 ? `| ${formatDiopter(parsedOsCyl)} CYL` : ""}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Preview Power: <strong className="text-[#ff7a00] font-bold font-mono">{formatDiopter(dominantSph)} D</strong>
          </span>
        </div>

        {/* SINGLE FOCUSED LENS PREVIEW CARD */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT: Lens Details & Specs (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#ff7a00] uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/70">
                    Index {activePackage.index} · {activePackage.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {activePackage.idealRange}
                  </span>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {activePackage.name}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {activePackage.description}
                </p>
              </div>

              {/* Optical Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {activePackage.coating}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-sky-600" />
                  100% UV400 Protected
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {activePackage.abbeValue}
                </span>
              </div>

              {/* Live Calculated Price Display */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">
                    Calculated Pair Total
                  </span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatPrice(calculatedPrice)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
                  Lab Precision Fitted
                </span>
              </div>
            </div>

            {/* RIGHT: Dynamic Parametric SVG Cross-Section (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-[16/10] bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-center p-4 overflow-hidden shadow-2xs">
                <svg
                  viewBox="0 0 180 100"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id={`grad-focus-${activePackage.id}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.12" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.16" />
                    </linearGradient>
                  </defs>

                  {/* Lens Cross-section Profile */}
                  <path
                    d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
                    fill={`url(#grad-focus-${activePackage.id})`}
                    stroke="#ff7a00"
                    strokeWidth="2.5"
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
                <div className="absolute top-3 right-3 text-xs font-mono font-bold text-slate-800 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  Edge: ~{edge} mm
                </div>
                <div className="absolute bottom-3 left-3 text-xs font-mono font-medium text-slate-600 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  Center: ~{center} mm
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">
                Physical cross-section modeled for index {activePackage.index}
              </span>
            </div>
          </div>

          {/* High-Diopter Smart Recommendation Banner */}
          {isHighDiopter && is156Index && ultraThinPackage && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  <strong>💡 Pro Tip for High Prescription ({formatDiopter(dominantSph)} D):</strong> Switching to{" "}
                  <strong>{ultraThinPackage.name} (1.67 Index)</strong> will reduce your lens edge thickness from ~{edge} mm down to ~{specs167.edge} mm (up to 35% slimmer and lighter).
                </p>
              </div>
              {onSelectPackage && (
                <button
                  type="button"
                  onClick={() => onSelectPackage(ultraThinPackage)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#ff7a00] hover:bg-[#e56e00] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Switch to 1.67 Ultra-Thin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isHighDiopter && !is156Index && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>✨ Optimal High-Index Choice:</strong> You have selected our 1.67 Ultra-Thin Aspheric design, ensuring the thinnest and lightest profile for your {formatDiopter(dominantSph)} D prescription.
              </span>
            </div>
          )}
        </div>

        {/* Optical Studio Laboratory Guarantee */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            All lenses are custom-beveled using computer-controlled CNC edging machines to match your selected frame geometry with sub-millimeter precision.
          </p>
        </div>
      </div>
    </div>
  );
}
