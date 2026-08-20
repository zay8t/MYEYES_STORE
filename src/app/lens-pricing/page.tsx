"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Tag, Calculator, Eye, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Check } from "lucide-react";
import {
  calculateTotalLensPrice,
  calculateTotalProgressivePrice,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/pricingEngine";
import { formatPrice, cn } from "@/lib/utils";
import LensThicknessSimulator from "@/components/pricing/LensThicknessSimulator";
import { LENS_PACKAGES } from "@/lib/prescription-pricing";

// Standard Single Vision Lenses
const CORE_SINGLE_VISION_LENSES = LENS_PACKAGES;

// Presbyopia (+40) Progressive Lenses (Option 5 excluded)
const CORE_PROGRESSIVE_LENSES = [
  {
    id: "progressive-freeform",
    name: "MY EYES Progressive Standard",
    baseKey: "P1",
    description: "No-line seamless transition between distance, intermediate, and near vision with hard crystal coating.",
  },
  {
    id: "sv-156-bluecut",
    name: "MY EYES Progressive Blue Light Filter",
    baseKey: "P2",
    description: "Progressive distance-to-reading vision with full digital screen blue light & UV protection.",
  },
  {
    id: "sv-156-photogrey",
    name: "MY EYES Progressive Sun Adaptive",
    baseKey: "P3",
    description: "Progressive lens that darkens automatically outdoors and clears indoors — distance to near.",
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "MY EYES Progressive Dual Shield",
    baseKey: "P4",
    description: "Ultimate progressive protection: sun-adaptive tint + blue light filter across full vision range.",
  },
];

// Diopter Option Generators
const SPH_OPTIONS_MINUS = Array.from({ length: 48 }, (_, i) => {
  const val = -12.00 + i * 0.25;
  return val.toFixed(2);
}).reverse();

const SPH_OPTIONS_PLUS = Array.from({ length: 24 }, (_, i) => {
  const val = 0.25 + i * 0.25;
  return `+${val.toFixed(2)}`;
});

const SPH_ALL_OPTIONS = [...SPH_OPTIONS_MINUS, "+0.00", ...SPH_OPTIONS_PLUS];

const CYL_OPTIONS_MINUS = Array.from({ length: 24 }, (_, i) => {
  const val = -6.00 + i * 0.25;
  return val.toFixed(2);
}).reverse();

const CYL_OPTIONS_PLUS = Array.from({ length: 16 }, (_, i) => {
  const val = 0.25 + i * 0.25;
  return `+${val.toFixed(2)}`;
});

const CYL_ALL_OPTIONS = [...CYL_OPTIONS_MINUS, "+0.00", ...CYL_OPTIONS_PLUS];

const ADD_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const val = 0.50 + i * 0.25;
  return `+${val.toFixed(2)}`;
});

// Utility functions for diopter signs and formatting
function formatDiopter(valStr: string): string {
  const trimmed = String(valStr || "").trim();
  if (!trimmed) return "+0.00";
  const num = parseFloat(trimmed);
  if (isNaN(num)) return "+0.00";
  if (num === 0) return "+0.00";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}`;
}

function toggleSign(valStr: string, targetSign: "+" | "-"): string {
  const rawNum = Math.abs(parseFloat(valStr) || 0);
  const sign = targetSign === "-" ? "-" : "+";
  return `${sign}${rawNum.toFixed(2)}`;
}

function getSign(valStr: string): "+" | "-" {
  const trimmed = String(valStr || "").trim();
  if (trimmed.startsWith("-")) return "-";
  return "+";
}

interface PrescriptionInputGroupProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function PrescriptionInputGroup({ label, value, onChange, options }: PrescriptionInputGroupProps) {
  const currentSign = getSign(value);

  const handleSignChange = (targetSign: "+" | "-") => {
    onChange(toggleSign(value, targetSign));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
          {label}
        </label>
        {/* Segmented Sign Toggles (+ / -) */}
        <div className="inline-flex rounded-xl p-1 bg-neutral-100 border border-neutral-200/60 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => handleSignChange("+")}
            className={cn(
              "px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
              currentSign === "+"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 font-medium"
            )}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleSignChange("-")}
            className={cn(
              "px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
              currentSign === "-"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-neutral-500 hover:text-neutral-900 font-medium"
            )}
          >
            -
          </button>
        </div>
      </div>

      <div className="relative">
        <select
          value={formatDiopter(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-medium transition-all outline-none font-mono font-bold"
        >
          <optgroup label="Minus (-) Diopters">
            {options.filter((o) => o.startsWith("-")).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </optgroup>
          <optgroup label="Plano / Zero">
            <option value="+0.00">+0.00 (Plano)</option>
          </optgroup>
          <optgroup label="Plus (+) Diopters">
            {options.filter((o) => o.startsWith("+")).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
}

export default function LensPricingPage() {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);

  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/admin/base-prices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBasePrices(data);
        }
      } catch (error) {
        console.error("Failed to load base prices:", error);
      }
    }
    loadPrices();
  }, []);

  // Calculator State
  const [selectedLensId, setSelectedLensId] = useState("sv-156-bluecut"); // Default to Bluecut
  
  const [age, setAge] = useState("");
  const [add, setAdd] = useState("");

  const [odSph, setOdSph] = useState("-2.00");
  const [odCyl, setOdCyl] = useState("-0.50");
  
  const [osSph, setOsSph] = useState("-2.00");
  const [osCyl, setOsCyl] = useState("-0.50");

  const parsedAge = parseInt(String(age || 0), 10);
  const parsedAdd = parseFloat(String(add || 0));

  // Determine if Presbyopia (+40) Progressive Mode is active
  const isPresbyopiaMode = parsedAge >= 40 && parsedAdd >= 0.50 && parsedAdd <= 3.50;

  // Active Lenses array (4 Progressive vs 5 Single Vision)
  const activeLenses = useMemo(() => {
    return isPresbyopiaMode ? CORE_PROGRESSIVE_LENSES : CORE_SINGLE_VISION_LENSES;
  }, [isPresbyopiaMode]);

  // If entering Presbyopia mode and selected lens is Ultra Thin (Option 5), fall back to option 1
  useEffect(() => {
    if (isPresbyopiaMode && selectedLensId === "sv-167-shmc") {
      setSelectedLensId("progressive-freeform");
    }
  }, [isPresbyopiaMode, selectedLensId]);

  const parsedOdSph = parseFloat(odSph) || 0;
  const parsedOdCyl = parseFloat(odCyl) || 0;
  const parsedOsSph = parseFloat(osSph) || 0;
  const parsedOsCyl = parseFloat(osCyl) || 0;

  const calculationResult = useMemo(() => {
    if (isPresbyopiaMode) {
      return calculateTotalProgressivePrice(
        selectedLensId,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        parsedAdd,
        basePrices
      );
    }
    return calculateTotalLensPrice(
      selectedLensId,
      { sph: parsedOdSph, cyl: parsedOdCyl },
      { sph: parsedOsSph, cyl: parsedOsCyl },
      basePrices
    );
  }, [isPresbyopiaMode, selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, parsedAdd, basePrices]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-neutral-50/50 py-12 text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto border-b border-neutral-200/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold uppercase tracking-widest text-amber-700">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            Official MY EYES Precision Lens Catalog
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
            Prescription Lens Pricing
          </h1>

          <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mx-auto font-normal">
            Transparent, dynamic pricing direct from MY EYES Precision Labs. All prices strictly adhere to our matrix engine ensuring exactly what you see is what you pay.
          </p>

          {/* Active Mode Notification Pill */}
          {isPresbyopiaMode && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>✨ Presbyopia (+40) Progressive Calculator Active</span>
            </div>
          )}
        </div>

        {/* Core Lenses Catalog Overview */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                {isPresbyopiaMode ? "Select from our 4 Presbyopia (+40) Progressive Lens Packages" : "Our 5 Core Lens Packages"}
              </h2>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                {isPresbyopiaMode
                  ? "Custom progressive no-line lenses tailored to your reading addition (Option 5 Ultra-Thin excluded)."
                  : "Standard single-vision precision optical lens packages with live lab base pricing."}
              </p>
            </div>
            {isPresbyopiaMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 flex-shrink-0">
                <Check className="w-3.5 h-3.5" /> Progressive Rates Applied
              </span>
            )}
          </div>
          
          <div className={`grid grid-cols-1 ${isPresbyopiaMode ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6 mb-6`}>
            {activeLenses.slice(0, isPresbyopiaMode ? 4 : 3).map((lens) => (
              <div
                key={lens.id}
                onClick={() => setSelectedLensId(lens.id)}
                className={cn(
                  "border rounded-2xl p-5 transition-all duration-200 shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between",
                  selectedLensId === lens.id
                    ? "ring-2 ring-amber-500/20 border-amber-500 bg-amber-50/20"
                    : "bg-white border-neutral-200 hover:border-neutral-400"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-neutral-900 font-bold text-base tracking-tight">
                      {lens.name}
                    </h3>
                    {selectedLensId === lens.id && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-slate-950 font-extrabold" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 inline-block">
                    Starting from Rs. {(basePrices[lens.baseKey as keyof BasePriceConfig] || 0).toLocaleString()}/-
                  </div>
                  <p className="text-neutral-500 text-xs leading-relaxed font-normal">
                    {lens.description}
                  </p>
                </div>
                <div className="border-t border-neutral-100 pt-4 mt-4">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Starting from</span>
                  <span className="text-2xl font-black text-amber-600">
                    {formatPrice(basePrices[lens.baseKey as keyof BasePriceConfig])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!isPresbyopiaMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6">
              {activeLenses.slice(3, 5).map((lens) => (
                <div
                  key={lens.id}
                  onClick={() => setSelectedLensId(lens.id)}
                  className={cn(
                    "border rounded-2xl p-5 transition-all duration-200 shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between",
                    selectedLensId === lens.id
                      ? "ring-2 ring-amber-500/20 border-amber-500 bg-amber-50/20"
                      : "bg-white border-neutral-200 hover:border-neutral-400"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-neutral-900 font-bold text-base tracking-tight">
                        {lens.name}
                      </h3>
                      {selectedLensId === lens.id && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-slate-950 font-extrabold" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 inline-block">
                      Starting from Rs. {(basePrices[lens.baseKey as keyof BasePriceConfig] || 0).toLocaleString()}/-
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed font-normal">
                      {lens.description}
                    </p>
                  </div>
                  <div className="border-t border-neutral-100 pt-4 mt-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Starting from</span>
                    <span className="text-2xl font-black text-amber-600">
                      {formatPrice(basePrices[lens.baseKey as keyof BasePriceConfig])}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Matrix Calculator Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 border-b border-neutral-100 pb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">Live Prescription Calculator</h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">Test any SPH, CYL, and ADD combination against our live pricing matrix.</p>
              </div>
            </div>

            <div className="space-y-8">
              
              {/* ================================================================ */}
              {/* 1. TOP CONTROLS SECTION (Age, Near ADD, Lens Package Select) */}
              {/* ================================================================ */}
              <div className="space-y-4 border-b border-neutral-100 pb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-l-4 border-amber-500 pl-3">
                  Step 1: Patient Profile &amp; Lens Type
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Field 1 (Age Input) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-medium transition-all outline-none font-bold"
                    />
                    <p className="text-xs text-neutral-500 mt-1.5 font-normal">
                      Determines single vision vs progressive (+40) mode
                    </p>
                  </div>

                  {/* Field 2 (Near Addition / ADD Dropdown) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">
                      Near Addition (ADD)
                    </label>
                    <select
                      value={formatDiopter(add)}
                      onChange={(e) => setAdd(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-medium transition-all outline-none font-mono font-bold"
                    >
                      <option value="+0.00">None / 0.00</option>
                      <optgroup label="Progressive Addition (+)">
                        {ADD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Field 3 (Select Lens Package Dropdown) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">
                      Select Lens Package
                    </label>
                    <select
                      value={selectedLensId}
                      onChange={(e) => setSelectedLensId(e.target.value)}
                      className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-medium transition-all outline-none font-bold truncate"
                    >
                      {activeLenses.map((lens) => (
                        <option key={lens.id} value={lens.id}>
                          {lens.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic Status Pill */}
                <div className="pt-2">
                  {!isPresbyopiaMode ? (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-semibold">
                      <span>Single Vision Calculator Active</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Presbyopia (+40) Progressive Calculator Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Prescription Powers (OD / OS) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-l-4 border-amber-500 pl-3">
                  Step 2: Enter Eye Prescription (OD &amp; OS)
                </h3>

                {/* WhatsApp PD Measurement Notice for Presbyopia (+40) Flow */}
                {isPresbyopiaMode && (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
                    <strong>Pupillary Distance (PD) Measurement:</strong> For custom Presbyopia (+40) progressive lenses, our optical team will contact you directly on WhatsApp after order placement for your exact Pupillary Distance (PD) measurement.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* OD */}
                  <div className="p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4">
                    <div className="flex items-center gap-2 mb-1 border-b border-neutral-200/60 pb-3">
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Right Eye (OD)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <PrescriptionInputGroup
                        label="Sphere (SPH)"
                        value={odSph}
                        onChange={setOdSph}
                        options={SPH_ALL_OPTIONS}
                      />
                      <PrescriptionInputGroup
                        label="Cylinder (CYL)"
                        value={odCyl}
                        onChange={setOdCyl}
                        options={CYL_ALL_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* OS */}
                  <div className="p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4">
                    <div className="flex items-center gap-2 mb-1 border-b border-neutral-200/60 pb-3">
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Left Eye (OS)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <PrescriptionInputGroup
                        label="Sphere (SPH)"
                        value={osSph}
                        onChange={setOsSph}
                        options={SPH_ALL_OPTIONS}
                      />
                      <PrescriptionInputGroup
                        label="Cylinder (CYL)"
                        value={osCyl}
                        onChange={setOsCyl}
                        options={CYL_ALL_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Output */}
              <div className="pt-6 border-t border-neutral-100">
                {!calculationResult ? (
                  <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-900">
                        {isPresbyopiaMode ? "Custom Progressive RX Required — Contact Support" : "Custom RX Required — Contact Support"}
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        The prescription powers entered fall outside our standard automated pricing matrix. 
                        Please contact support for a custom laboratory quote.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/30 rounded-2xl border border-amber-200/60 p-6 sm:p-8 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        {isPresbyopiaMode ? "Estimated Progressive Lens Cost" : "Estimated Lens Cost"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> {isPresbyopiaMode ? "Progressive Matrix Verified" : "Matrix Verified"}
                      </div>
                    </div>

                    {calculationResult.isAsymmetricRx ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-neutral-200 border-dashed">
                          <span className="text-sm font-semibold text-neutral-700">Right Lens (OD) — +Rs. {(calculationResult.rightEyeLensPrice || 0).toLocaleString()}/-</span>
                          <span className="font-mono font-bold text-neutral-900">{formatPrice(calculationResult.rightEyeLensPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-neutral-200 border-dashed">
                          <span className="text-sm font-semibold text-neutral-700">Left Lens (OS) — +Rs. {(calculationResult.leftEyeLensPrice || 0).toLocaleString()}/-</span>
                          <span className="font-mono font-bold text-neutral-900">{formatPrice(calculationResult.leftEyeLensPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                          <span className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">Combined Total</span>
                          <span className="text-3xl font-black text-amber-600">{formatPrice(calculationResult.finalPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                          <span className="text-sm font-semibold text-neutral-700 block mb-1">
                            {isPresbyopiaMode ? "Progressive Prescription Lenses" : "Prescription Lenses"} — +Rs. {calculationResult.finalPrice.toLocaleString()}/-
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">Both lenses priced identically.</span>
                        </div>
                        <span className="text-4xl font-black text-amber-600">
                          {formatPrice(calculationResult.finalPrice)}
                        </span>
                      </div>
                    )}

                    {/* Cash on Delivery Advance Payment Notice Banner */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold shadow-2xs">
                      {isPresbyopiaMode
                        ? "40% advance must for Cash on Delivery progressive orders."
                        : "25% advance must for Cash on Delivery orders."}
                    </div>
                  </div>
                )}
              </div>

              {/* Call to action */}
              <div className="pt-4 text-center">
                <Link 
                  href="/eyeglasses"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] font-bold shadow-sm transition-all hover:shadow-md hover:scale-[1.01]"
                >
                  Shop Eyeglasses Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  INTERACTIVE LENS THICKNESS & REFRACTIVE INDEX SIMULATOR     */}
        {/* ============================================================ */}
        <div className="pt-12">
          <LensThicknessSimulator />
        </div>

      </div>
    </div>
  );
}
