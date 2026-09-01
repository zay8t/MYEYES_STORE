"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Lightbulb,
  Zap,
  Layers,
  Eye,
  BookOpen,
} from "lucide-react";
import {
  LENS_PACKAGES,
  LensPackageDefinition,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/prescription-pricing";
import {
  runLensSimulator,
  INDEX_REGISTRY,
  type SingleVisionThickness,
  type ProgressiveZoneThickness,
} from "@/lib/optical/lensThicknessSimulator";
import { calculateTotalLensPrice, calculateTotalProgressivePrice } from "@/lib/pricingEngine";
import { formatPrice } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LensThicknessSimulatorProps {
  odSph?: number | string;
  osSph?: number | string;
  odCyl?: number | string;
  osCyl?: number | string;
  add?: number | string;
  visionType?: "single_vision" | "progressive";
  selectedPackageId?: string;
  finalCalculatedPrice?: number;
  onSelectPackage?: (pkg: LensPackageDefinition) => void;
  className?: string;
  isModal?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDiopter(val: number | string | undefined): number {
  return typeof val === "number" ? val : parseFloat(String(val || 0)) || 0;
}

function formatDiopter(val: number): string {
  if (val === 0) return "+0.00";
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

// Clamp SVG visual height to a sensible band
function toVisualH(mm: number, scale = 4.5): number {
  return Math.min(38, Math.max(5, mm * scale));
}

// ─── SVG Components ───────────────────────────────────────────────────────────

interface LensSVGProps {
  center: number;
  edge: number;
  isProgressive: boolean;
  /** For progressive: reading center thickness */
  readingCenter?: number;
  indexStr: string;
  packageId: string;
}

function LensCrossSectionSVG({ center, edge, isProgressive, readingCenter, indexStr, packageId }: LensSVGProps) {
  const gradId = `grad-${packageId.replace(/[^a-z0-9]/gi, "")}`;
  const progGradId = `prog-${packageId.replace(/[^a-z0-9]/gi, "")}`;

  const visualEdgeH = toVisualH(edge);
  const visualCenterH = toVisualH(center);

  const topY = 50 - visualCenterH / 2;
  const bottomY = 50 + visualCenterH / 2;
  const leftTopY = 50 - visualEdgeH / 2;
  const leftBottomY = 50 + visualEdgeH / 2;
  const rightTopY = 50 - visualEdgeH / 2;
  const rightBottomY = 50 + visualEdgeH / 2;

  // Progressive second zone (reading segment — slightly thicker center line if plus)
  const readH = isProgressive && readingCenter ? toVisualH(readingCenter) : 0;
  const readTopY = 50 - readH / 2;
  const readBottomY = 50 + readH / 2;

  return (
    <svg
      viewBox="0 0 180 100"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Lens cross-section for index ${indexStr}`}
    >
      <defs>
        {/* Main lens fill gradient */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.10" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.14" />
        </linearGradient>

        {/* Progressive reading zone overlay gradient */}
        {isProgressive && (
          <linearGradient id={progGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.00" />
            <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.22" />
          </linearGradient>
        )}
      </defs>

      {/* ── Main Lens Body ────────────────────────────────────────────── */}
      <path
        d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
        fill={`url(#${gradId})`}
        stroke="#ff7a00"
        strokeWidth="2.5"
      />

      {/* ── Progressive Reading Zone Overlay ─────────────────────────── */}
      {isProgressive && readingCenter && readH > 0 && (
        <>
          {/* Reading zone mask — covers the lower 45% of the lens */}
          <clipPath id={`clip-lower-${gradId}`}>
            <rect x="20" y="55" width="140" height="45" />
          </clipPath>
          <path
            d={`M 20 ${leftTopY} Q 90 ${topY} 160 ${rightTopY} L 160 ${rightBottomY} Q 90 ${bottomY} 20 ${leftBottomY} Z`}
            fill={`url(#${progGradId})`}
            clipPath={`url(#clip-lower-${gradId})`}
          />
          {/* Reading zone demarcation curve */}
          <path
            d={`M 25 57 Q 90 52 155 57`}
            stroke="#a78bfa"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.7"
          />

          {/* Reading zone label */}
          <text x="90" y="70" textAnchor="middle" fontSize="5" fill="#7c3aed" fontFamily="sans-serif" fontWeight="bold" opacity="0.85">
            Reading Area
          </text>
          <text x="90" y="40" textAnchor="middle" fontSize="5" fill="#ff7a00" fontFamily="sans-serif" fontWeight="bold" opacity="0.85">
            Distance View
          </text>

          {/* Reading center caliper */}
          <line x1="97" y1={readTopY} x2="97" y2={readBottomY} stroke="#a78bfa" strokeWidth="1.5" />
          <line x1="94" y1={readTopY} x2="100" y2={readTopY} stroke="#a78bfa" strokeWidth="1" />
          <line x1="94" y1={readBottomY} x2="100" y2={readBottomY} stroke="#a78bfa" strokeWidth="1" />
        </>
      )}

      {/* ── Optical Axis Dashed Guide ─────────────────────────────────── */}
      <line
        x1="90" y1="10"
        x2="90" y2="90"
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* ── Edge Caliper (left) ───────────────────────────────────────── */}
      <line x1="15" y1={leftTopY} x2="15" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1.5" />
      <line x1="12" y1={leftTopY} x2="18" y2={leftTopY} stroke="#ff7a00" strokeWidth="1" />
      <line x1="12" y1={leftBottomY} x2="18" y2={leftBottomY} stroke="#ff7a00" strokeWidth="1" />

      {/* ── Center Caliper (right of axis) ────────────────────────────── */}
      <line x1="95" y1={topY} x2="95" y2={bottomY} stroke="#38bdf8" strokeWidth="1.5" />
      <line x1="92" y1={topY} x2="98" y2={topY} stroke="#38bdf8" strokeWidth="1" />
      <line x1="92" y1={bottomY} x2="98" y2={bottomY} stroke="#38bdf8" strokeWidth="1" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LensThicknessSimulator({
  odSph = "-2.00",
  osSph = "-2.00",
  odCyl = "0.00",
  osCyl = "0.00",
  add = "+1.50",
  visionType = "single_vision",
  selectedPackageId = "sv-156-bluecut",
  finalCalculatedPrice,
  onSelectPackage,
  className = "",
  isModal = false,
}: LensThicknessSimulatorProps) {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);

  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/base-prices", { cache: "no-store" });
        if (res.ok) setBasePrices(await res.json());
      } catch { /* silent */ }
    }
    loadPrices();
  }, []);

  // ── Parsed values ──────────────────────────────────────────────────────────
  const parsedOdSph = parseDiopter(odSph);
  const parsedOsSph = parseDiopter(osSph);
  const parsedOdCyl = parseDiopter(odCyl);
  const parsedOsCyl = parseDiopter(osCyl);
  const parsedAdd   = parseDiopter(add);
  const isProgressive = visionType === "progressive";

  // Dominant eye
  const maxAbsSph = Math.max(Math.abs(parsedOdSph), Math.abs(parsedOsSph));
  const dominantSph = Math.abs(parsedOdSph) >= Math.abs(parsedOsSph) ? parsedOdSph : parsedOsSph;

  // ── Active Package ─────────────────────────────────────────────────────────
  const activePackage = useMemo(
    () => LENS_PACKAGES.find((p) => p.id === selectedPackageId) ?? LENS_PACKAGES[1],
    [selectedPackageId]
  );

  // ── Physics Simulation ─────────────────────────────────────────────────────
  const simResult = useMemo(() => runLensSimulator({
    odSph: parsedOdSph,
    osSph: parsedOsSph,
    odCyl: parsedOdCyl,
    osCyl: parsedOsCyl,
    add: parsedAdd,
    visionType,
    tier: activePackage.baseKey,
  }), [parsedOdSph, parsedOsSph, parsedOdCyl, parsedOsCyl, parsedAdd, visionType, activePackage.baseKey]);

  // ── Benchmark vs 1.67 in single-vision mode ───────────────────────────────
  const bench167 = useMemo(() => runLensSimulator({
    odSph: parsedOdSph,
    osSph: parsedOsSph,
    odCyl: parsedOdCyl,
    osCyl: parsedOsCyl,
    add: parsedAdd,
    visionType,
    tier: "B5",
  }), [parsedOdSph, parsedOsSph, parsedOdCyl, parsedOsCyl, parsedAdd, visionType]);

  // ── Derived display values ─────────────────────────────────────────────────
  const { centerMm, edgeMm, readingCenterMm } = useMemo(() => {
    if (simResult.mode === "progressive") {
      const r = simResult as ProgressiveZoneThickness;
      return {
        centerMm: r.distanceCenter,
        edgeMm: r.distanceEdge,
        readingCenterMm: r.readingCenter,
      };
    }
    const r = simResult as SingleVisionThickness;
    return { centerMm: r.center, edgeMm: r.edge, readingCenterMm: undefined };
  }, [simResult]);

  const bench167Edge = bench167.mode === "single_vision"
    ? (bench167 as SingleVisionThickness).edge
    : (bench167 as ProgressiveZoneThickness).distanceEdge;

  // Progressive derived values
  const readingPower = isProgressive ? parsedAdd + dominantSph : null;

  // ── Live Price — Single Source of Truth ─────────────────────────────────────
  const calculatedPrice = useMemo(() => {
    if (finalCalculatedPrice !== undefined) {
      return finalCalculatedPrice;
    }
    if (isProgressive) {
      const res = calculateTotalProgressivePrice(
        activePackage.id,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        parsedAdd,
        basePrices
      );
      if (res) return res.finalPrice;
    }
    const res = calculateTotalLensPrice(
      activePackage.id,
      { sph: parsedOdSph, cyl: parsedOdCyl },
      { sph: parsedOsSph, cyl: parsedOsCyl },
      basePrices
    );
    return res ? res.finalPrice : basePrices[activePackage.baseKey];
  }, [finalCalculatedPrice, activePackage, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, parsedAdd, isProgressive, basePrices]);

  // ── Recommendation flags ───────────────────────────────────────────────────
  const isHighDiopter = maxAbsSph >= 4.00;
  const is156Index = activePackage.index === "1.56";
  const ultraThinPkg = LENS_PACKAGES.find((p) => p.id === "sv-167-shmc");

  // Simplified badge labels
  const indexBadgeLabel = activePackage.index === "1.67" ? "1.67 Extra Thin" : "1.56 Standard Thin";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full bg-white ${isModal ? "py-2" : "pt-8 pb-4"} ${className}`}>
      <div className="space-y-6">

        {/* ── Page Header with Simplified Copy ────────────────────────────── */}
        {!isModal && (
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-1.5 block">
              LENS THICKNESS PREVIEW
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Estimated Lens Thickness
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              See how thin and light your lenses will look in your frames.
            </p>
          </div>
        )}

        {/* ── Live Prescription Indicator Row ────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span className="font-semibold text-slate-700">Your Numbers:</span>

            {/* OD */}
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              OD: {formatDiopter(parsedOdSph)}
              {parsedOdCyl !== 0 ? ` | Cyl ${formatDiopter(parsedOdCyl)}` : ""}
            </span>

            {/* OS */}
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              OS: {formatDiopter(parsedOsSph)}
              {parsedOsCyl !== 0 ? ` | Cyl ${formatDiopter(parsedOsCyl)}` : ""}
            </span>

            {/* ADD pill — only for progressive */}
            {isProgressive && parsedAdd !== 0 && (
              <span className="font-mono font-bold text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200 shadow-2xs">
                ADD: +{parsedAdd.toFixed(2)}
              </span>
            )}

            {/* Effective Reading Power */}
            {isProgressive && readingPower !== null && (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                Near: {formatDiopter(readingPower)} D
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            {isProgressive ? "Near & Far View" : "Single Vision"}{" "}
            ·{" "}
            <strong className="text-[#ff7a00] font-bold font-mono">
              {formatDiopter(dominantSph)} D
            </strong>
          </span>
        </div>

        {/* ── Main Card ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* LEFT: Lens Details & Specs */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                {/* Simplified Feature Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#ff7a00] uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/70">
                    {indexBadgeLabel}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {activePackage.idealRange}
                  </span>
                  {isProgressive && (
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Near &amp; Far View
                    </span>
                  )}
                </div>

                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {activePackage.name}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {activePackage.description}
                </p>
              </div>

              {/* ── Simplified Prescription Summary Box ─────────────────────── */}
              {isProgressive && simResult.mode === "progressive" && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    Prescription Summary
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-white rounded-lg border border-violet-100 p-2 text-center">
                      <div className="font-bold text-violet-700 font-mono">
                        {formatDiopter((simResult as ProgressiveZoneThickness).fMax)} D
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Max Strength</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-100 p-2 text-center">
                      <div className="font-bold text-emerald-700 font-mono">
                        {formatDiopter((simResult as ProgressiveZoneThickness).readingPower)} D
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Reading Power</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-100 p-2 text-center">
                      <div className="font-bold text-slate-700 font-mono">
                        {(simResult as ProgressiveZoneThickness).readingCenter} mm
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Reading Thickness</div>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Live Price — Guaranteed 100% Synchronized */}
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

            {/* RIGHT: Parametric SVG Cross-Section */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-[16/10] bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-center p-4 overflow-hidden shadow-2xs">
                <LensCrossSectionSVG
                  center={centerMm}
                  edge={edgeMm}
                  isProgressive={isProgressive}
                  readingCenter={readingCenterMm}
                  indexStr={activePackage.index}
                  packageId={activePackage.id}
                />

                {/* Simplified Measurement Callouts */}
                <div className="absolute top-3 right-3 text-xs font-mono font-bold text-slate-800 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  Edge: ~{edgeMm} mm
                </div>
                <div className="absolute bottom-3 left-3 text-xs font-mono font-medium text-slate-600 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  Center: ~{centerMm} mm
                </div>
                {isProgressive && readingCenterMm !== undefined && (
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold text-violet-700 bg-violet-50/95 px-2 py-1 rounded-lg border border-violet-200 shadow-xs">
                    Reading Area: ~{readingCenterMm} mm
                  </div>
                )}

                {/* Simplified Index badge overlay */}
                <div className="absolute top-3 left-3 text-[9px] font-mono font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                  {indexBadgeLabel}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                {activePackage.index === "1.67"
                  ? "Modeled for extra thin 1.67 index lenses."
                  : "Modeled for standard 1.56 index lenses."}
              </span>
            </div>
          </div>

          {/* ── High-Diopter Recommendation ──────────────────────────────── */}
          {isHighDiopter && is156Index && ultraThinPkg && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  <strong>💡 Tip for Strong Numbers ({formatDiopter(dominantSph)} D):</strong>{" "}
                  Switching to <strong>{ultraThinPkg.name}</strong> will make your lenses up to 35%
                  slimmer and lighter (edge ~{bench167Edge} mm).
                </p>
              </div>
              {onSelectPackage && (
                <button
                  type="button"
                  onClick={() => onSelectPackage(ultraThinPkg)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#ff7a00] hover:bg-[#e56e00] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Switch to Extra Thin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isHighDiopter && !is156Index && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>✨ Optimal Choice:</strong> You have selected our Extra Thin lenses (1.67), giving you the thinnest and lightest look for your numbers.
              </span>
            </div>
          )}
        </div>

        {/* ── Lab Guarantee ──────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="leading-relaxed">
            Every lens is carefully cut and fitted in our lab to match your frame perfectly.
          </p>
        </div>
      </div>
    </div>
  );
}
