"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalogFilters, CatalogFilterState } from "@/lib/hooks/useCatalogFilters";
import { FacetGroup } from "@/lib/catalog/facetAggregator";

interface FilterSidebarProps {
  facets: FacetGroup[];
  totalProducts?: number;
}

export default function FilterSidebar({ facets }: FilterSidebarProps) {
  const {
    filters,
    activeFilterCount,
    toggleFilter,
    setPriceRange,
    resetFilters,
  } = useCatalogFilters();

  // Accordion state: open all by default for luxury full-faceted discovery
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gender: true,
    shape: true,
    fit: true,
    color: true,
    material: true,
    prescription: true,
    vibe: true,
    price: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local price slider state for smooth drag
  const [localMinPrice, setLocalMinPrice] = useState<number>(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(filters.maxPrice);

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalMinPrice(val);
    setPriceRange(val, localMaxPrice);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalMaxPrice(val);
    setPriceRange(localMinPrice, val);
  };

  // Helper to find a specific facet group
  const getFacetGroup = (id: keyof Omit<CatalogFilterState, "minPrice" | "maxPrice" | "sort" | "search">) => {
    return facets.find((f) => f.id === id);
  };

  const genderGroup = getFacetGroup("gender");
  const shapeGroup = getFacetGroup("shape");
  const fitGroup = getFacetGroup("fit");
  const colorGroup = getFacetGroup("color");
  const materialGroup = getFacetGroup("material");
  const prescriptionGroup = getFacetGroup("prescription");
  const vibeGroup = getFacetGroup("vibe");

  return (
    <aside className="w-80 shrink-0 pr-8 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar select-none text-slate-900 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & STYLE QUIZ ANCHOR
         ───────────────────────────────────────────────────────────── */}
      <div className="pb-5 mb-5 border-b border-slate-200/80 space-y-3">
        {/* Style Quiz Prompt Button */}
        <Link
          href="/quiz"
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 hover:border-amber-400 text-amber-950 transition-all duration-300 group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black tracking-tight leading-none">Find Your Fit Fast</p>
              <p className="text-[10px] text-amber-800 font-semibold mt-0.5">Start with a style quiz →</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
            60s
          </span>
        </Link>

        {/* Filter Title Bar & Reset */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold shadow-2xs">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ACCORDION 1: AUDIENCE & GENDER (Quiz Step 2)
         ───────────────────────────────────────────────────────────── */}
      {genderGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("gender")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{genderGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({genderGroup.stepHint})</span>
            </div>
            {openSections.gender ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.gender && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {genderGroup.options.map((opt) => {
                const isChecked = filters.gender.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer",
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed bg-transparent text-slate-400"
                        : isChecked
                        ? "bg-slate-100 text-slate-950 font-bold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={opt.disabled}
                        onChange={() => toggleFilter("gender", opt.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", isChecked ? "text-slate-900 font-extrabold" : "text-slate-400")}>
                      ({opt.count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ACCORDION 2: FRAME SHAPE & STYLE (Quiz Step 3/4)
         ───────────────────────────────────────────────────────────── */}
      {shapeGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("shape")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{shapeGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({shapeGroup.stepHint})</span>
            </div>
            {openSections.shape ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.shape && (
            <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
              {shapeGroup.options.map((opt) => {
                const isChecked = filters.shape.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => toggleFilter("shape", opt.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer relative",
                      opt.disabled
                        ? "opacity-35 cursor-not-allowed border-slate-100 bg-slate-50/50 text-slate-400"
                        : isChecked
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs font-bold"
                        : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/80 text-slate-800 font-medium"
                    )}
                  >
                    {/* SVG Frame Silhouette */}
                    {opt.svgShape && (
                      <svg
                        viewBox="0 0 120 60"
                        className={cn("w-12 h-6 mb-1.5 transition-transform group-hover:scale-105", isChecked ? "text-white" : "text-slate-700")}
                        dangerouslySetInnerHTML={{ __html: opt.svgShape }}
                      />
                    )}
                    <span className="text-[11px] leading-tight capitalize">{opt.label}</span>
                    <span className={cn("text-[9px] font-mono mt-0.5", isChecked ? "text-slate-300" : "text-slate-400")}>
                      ({opt.count})
                    </span>
                    {isChecked && (
                      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white text-slate-900 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. ACCORDION 3: FRAME WIDTH & FIT (Quiz Step 5)
         ───────────────────────────────────────────────────────────── */}
      {fitGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("fit")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{fitGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({fitGroup.stepHint})</span>
            </div>
            {openSections.fit ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.fit && (
            <div className="mt-3 grid grid-cols-2 gap-1.5 animate-fade-in">
              {fitGroup.options.map((opt) => {
                const isChecked = filters.fit.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => toggleFilter("fit", opt.id)}
                    className={cn(
                      "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center",
                      opt.disabled
                        ? "opacity-35 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                        : isChecked
                        ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-bold"
                        : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-medium"
                    )}
                  >
                    <span className="text-[11px] capitalize">{opt.label}</span>
                    <span className={cn("text-[9px] font-mono", isChecked ? "text-slate-300" : "text-slate-400")}>
                      {opt.sublabel} ({opt.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ACCORDION 4: COLOR & AESTHETIC PALETTE (15 Swatches)
         ───────────────────────────────────────────────────────────── */}
      {colorGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("color")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{colorGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({colorGroup.stepHint})</span>
            </div>
            {openSections.color ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.color && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {/* Grouped Swatches: Neutrals, Metals, Vibrant */}
              {(["Neutrals", "Metals", "Vibrant"] as const).map((groupTitle) => {
                const groupSwatches = colorGroup.options.filter((opt) => opt.sublabel === groupTitle);
                return (
                  <div key={groupTitle} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{groupTitle}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {groupSwatches.map((opt) => {
                        const isChecked = filters.color.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => toggleFilter("color", opt.id)}
                            title={`${opt.label} (${opt.count} frames)`}
                            className={cn(
                              "group/swatch relative flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer",
                              opt.disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
                            )}
                          >
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full border shadow-2xs flex items-center justify-center transition-all",
                                isChecked
                                  ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                                  : "border-black/15 group-hover/swatch:border-slate-700"
                              )}
                              style={{ backgroundColor: opt.colorHex }}
                            >
                              {isChecked && (
                                <Check
                                  className={cn(
                                    "w-3.5 h-3.5 stroke-[3]",
                                    opt.id === "crystal" || opt.id === "silver" ? "text-slate-900" : "text-white"
                                  )}
                                />
                              )}
                            </div>
                            <span className="text-[8px] font-medium text-slate-600 truncate max-w-[48px] text-center mt-1 leading-tight">
                              {opt.id === "rose_gold" ? "Rose G." : opt.label.split(" ")[0]}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400">({opt.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ACCORDION 5: MATERIAL PREFERENCE (Quiz Step 6)
         ───────────────────────────────────────────────────────────── */}
      {materialGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("material")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{materialGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({materialGroup.stepHint})</span>
            </div>
            {openSections.material ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.material && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {materialGroup.options.map((opt) => {
                const isChecked = filters.material.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer",
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed text-slate-400"
                        : isChecked
                        ? "bg-slate-100 text-slate-950 font-bold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={opt.disabled}
                        onChange={() => toggleFilter("material", opt.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", isChecked ? "text-slate-900 font-extrabold" : "text-slate-400")}>
                      ({opt.count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. ACCORDION 6: PRESCRIPTION & LENS COMPATIBILITY (Quiz Step 7)
         ───────────────────────────────────────────────────────────── */}
      {prescriptionGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("prescription")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{prescriptionGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({prescriptionGroup.stepHint})</span>
            </div>
            {openSections.prescription ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.prescription && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {prescriptionGroup.options.map((opt) => {
                const isChecked = filters.prescription.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer",
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed text-slate-400"
                        : isChecked
                        ? "bg-slate-100 text-slate-950 font-bold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={opt.disabled}
                        onChange={() => toggleFilter("prescription", opt.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", isChecked ? "text-slate-900 font-extrabold" : "text-slate-400")}>
                      ({opt.count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. ACCORDION 7: COLLECTION & VIBE (Quiz Step 9)
         ───────────────────────────────────────────────────────────── */}
      {vibeGroup && (
        <div className="py-4 border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => toggleSection("vibe")}
            className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{vibeGroup.title}</span>
              <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">({vibeGroup.stepHint})</span>
            </div>
            {openSections.vibe ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            )}
          </button>

          {openSections.vibe && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {vibeGroup.options.map((opt) => {
                const isChecked = filters.vibe.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer",
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed text-slate-400"
                        : isChecked
                        ? "bg-slate-100 text-slate-950 font-bold"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={opt.disabled}
                        onChange={() => toggleFilter("vibe", opt.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", isChecked ? "text-slate-900 font-extrabold" : "text-slate-400")}>
                      ({opt.count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. ACCORDION 8: PRICE RANGE SLIDER
         ───────────────────────────────────────────────────────────── */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase tracking-wider group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>Price Range (PKR)</span>
          </div>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          )}
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-4 animate-fade-in">
            {/* Price values display */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>Rs. {localMinPrice.toLocaleString()}</span>
              <span className="text-slate-400 font-normal">to</span>
              <span>Rs. {localMaxPrice.toLocaleString()}+</span>
            </div>

            {/* Sliders */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Min Price: Rs. {localMinPrice.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={localMinPrice}
                  onChange={handleMinPriceChange}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Max Price: Rs. {localMaxPrice.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="1000"
                  value={localMaxPrice}
                  onChange={handleMaxPriceChange}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
