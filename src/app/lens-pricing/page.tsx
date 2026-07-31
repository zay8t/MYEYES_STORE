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
import { formatPrice } from "@/lib/utils";

// Standard Single Vision Lenses
const CORE_SINGLE_VISION_LENSES = [
  {
    id: "progressive-freeform",
    name: "MY EYES CR Hard Crystal Coat",
    baseKey: "B1",
    description: "Single-vision clarity with standard hard crystal coating for daily scratch resistance.",
  },
  {
    id: "sv-156-bluecut",
    name: "MY EYES Blue Light Filter + UV Protection HMC",
    baseKey: "B2",
    description: "Blocks harmful digital screen blue light and 100% UV rays with HMC anti-reflective coating.",
  },
  {
    id: "sv-156-photogrey",
    name: "MY EYES Sun Adaptive Photochromic HMC",
    baseKey: "B3",
    description: "Transitions smoothly to dark grey in sunlight. Complete UV protection.",
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "MY EYES Dual Shield - Blue Light & Photochromic HMC",
    baseKey: "B4",
    description: "Ultimate hybrid: filters digital blue light indoors and transitions to sunglasses outdoors.",
  },
  {
    id: "sv-167-shmc",
    name: "MY EYES Ultra Thin Index",
    baseKey: "B5",
    description: "High-index ultra-thin profile for stronger prescriptions. Reduces lens thickness significantly.",
  },
];

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
    <div className="min-h-screen bg-white py-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto border-b border-slate-100 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-[11px] font-bold uppercase tracking-widest text-amber-700">
            <Tag className="w-3.5 h-3.5" />
            Official MY EYES Precision Lens Catalog
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Prescription Lens Pricing
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Transparent, dynamic pricing direct from MY EYES Precision Labs. All prices strictly adhere to our matrix engine ensuring exactly what you see is what you pay.
          </p>

          {/* Active Mode Notification Pill */}
          {isPresbyopiaMode && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black tracking-wide border border-amber-400 shadow-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Presbyopia (+40) Progressive Mode Active</span>
            </div>
          )}
        </div>

        {/* Core Lenses Grid */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isPresbyopiaMode ? "Select from our 4 Presbyopia (+40) Progressive Lens Packages" : "Our 5 Core Lens Packages"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isPresbyopiaMode
                  ? "Custom progressive no-line lenses tailored to your reading addition (Option 5 Ultra-Thin excluded)."
                  : "Standard single-vision precision optical lens packages with live lab base pricing."}
              </p>
            </div>
            {isPresbyopiaMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex-shrink-0">
                <Check className="w-3.5 h-3.5" /> Progressive Rates Applied
              </span>
            )}
          </div>
          
          <div className={`grid grid-cols-1 ${isPresbyopiaMode ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6 mb-6`}>
            {activeLenses.slice(0, isPresbyopiaMode ? 4 : 3).map((lens) => (
              <div
                key={lens.id}
                className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <h3 className="text-slate-900 font-bold text-base tracking-tight mb-1">
                    {lens.name}
                  </h3>
                  <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1 inline-block mb-2">
                    Starting from Rs. {(basePrices[lens.baseKey as keyof BasePriceConfig] || 0).toLocaleString()}/-
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4 font-normal">
                    {lens.description}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Starting from</span>
                  <span className="text-2xl font-black text-slate-900">
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
                  className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <h3 className="text-slate-900 font-bold text-base tracking-tight mb-1">
                      {lens.name}
                    </h3>
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1 inline-block mb-2">
                      Starting from Rs. {(basePrices[lens.baseKey as keyof BasePriceConfig] || 0).toLocaleString()}/-
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 font-normal">
                      {lens.description}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Starting from</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatPrice(basePrices[lens.baseKey as keyof BasePriceConfig])}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Matrix Calculator */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 lg:p-10">
              
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Live Prescription Calculator</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Test any SPH, CYL, and ADD combination against our live pricing matrix.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Age & Presbyopia (Near Addition ADD) Section */}
                <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Age & Presbyopia (Near Addition ADD) Settings</span>
                        {isPresbyopiaMode && (
                          <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded tracking-wide">
                            +40 Progressive
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Entering age 40+ with near addition (+0.50 to +3.50) automatically switches the calculator to Progressive Mode.
                      </p>
                    </div>
                    {isPresbyopiaMode && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wide flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        Progressive Mode Active
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Customer Age <span className="text-slate-400 font-normal">(Years)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Near Addition (ADD)
                        {parsedAge >= 40 && <span className="ml-1 text-[10px] text-amber-700 font-black uppercase">(+40 Required)</span>}
                      </label>
                      <select
                        value={add}
                        onChange={(e) => setAdd(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      >
                        <option value="">None (Single Vision)</option>
                        <option value="+0.50">+0.50</option>
                        <option value="+0.75">+0.75</option>
                        <option value="+1.00">+1.00</option>
                        <option value="+1.25">+1.25</option>
                        <option value="+1.50">+1.50</option>
                        <option value="+1.75">+1.75</option>
                        <option value="+2.00">+2.00</option>
                        <option value="+2.25">+2.25</option>
                        <option value="+2.50">+2.50</option>
                        <option value="+2.75">+2.75</option>
                        <option value="+3.00">+3.00</option>
                        <option value="+3.25">+3.25</option>
                        <option value="+3.50">+3.50</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lens Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Select Lens Package
                  </label>
                  <select
                    value={selectedLensId}
                    onChange={(e) => setSelectedLensId(e.target.value)}
                    className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white font-bold text-slate-900 transition-colors"
                  >
                    {activeLenses.map((lens) => (
                      <option key={lens.id} value={lens.id}>
                        {lens.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OD / OS Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* OD */}
                  <div className="space-y-4 p-5 rounded-2xl border border-blue-100 bg-blue-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-extrabold text-blue-900">Right Eye (OD)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sphere (SPH)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={odSph}
                          onChange={(e) => setOdSph(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cylinder (CYL)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={odCyl}
                          onChange={(e) => setOdCyl(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OS */}
                  <div className="space-y-4 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-extrabold text-indigo-900">Left Eye (OS)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sphere (SPH)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={osSph}
                          onChange={(e) => setOsSph(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cylinder (CYL)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={osCyl}
                          onChange={(e) => setOsCyl(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Output */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  {!calculationResult ? (
                    <div className="p-6 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
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
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {isPresbyopiaMode ? "Estimated Progressive Lens Cost" : "Estimated Lens Cost"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> {isPresbyopiaMode ? "Progressive Matrix Verified" : "Matrix Verified"}
                        </div>
                      </div>

                      {calculationResult.isAsymmetricRx ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                            <span className="text-sm font-semibold text-slate-700">Right Lens (OD) — +Rs. {(calculationResult.rightEyeLensPrice || 0).toLocaleString()}/-</span>
                            <span className="font-mono font-bold text-slate-900">{formatPrice(calculationResult.rightEyeLensPrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-200 border-dashed">
                            <span className="text-sm font-semibold text-slate-700">Left Lens (OS) — +Rs. {(calculationResult.leftEyeLensPrice || 0).toLocaleString()}/-</span>
                            <span className="font-mono font-bold text-slate-900">{formatPrice(calculationResult.leftEyeLensPrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-end pt-2">
                            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Combined Total</span>
                            <span className="text-3xl font-black text-amber-500">{formatPrice(calculationResult.finalPrice)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                          <div>
                            <span className="text-sm font-semibold text-slate-700 block mb-1">
                              {isPresbyopiaMode ? "Progressive Prescription Lenses" : "Prescription Lenses"} — +Rs. {calculationResult.finalPrice.toLocaleString()}/-
                            </span>
                            <span className="text-xs text-slate-400">Both lenses priced identically.</span>
                          </div>
                          <span className="text-4xl font-black text-amber-500">
                            {formatPrice(calculationResult.finalPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Call to action */}
                <div className="pt-6 text-center">
                  <Link 
                    href="/eyeglasses"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-sm transition-all hover:shadow-lg hover:scale-[1.01]"
                  >
                    Shop Eyeglasses Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}
