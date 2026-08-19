"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalogFilters, CatalogFilterState } from "@/lib/hooks/useCatalogFilters";
import { FacetGroup } from "@/lib/catalog/facetAggregator";

interface MobileFilterDrawerProps {
  facets: FacetGroup[];
  totalResults: number;
}

export default function MobileFilterDrawer({ facets, totalResults }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    filters,
    activeFilterCount,
    toggleFilter,
    setPriceRange,
    resetFilters,
  } = useCatalogFilters();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gender: true,
    shape: true,
    fit: false,
    color: true,
    material: false,
    prescription: false,
    vibe: false,
    price: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    <>
      {/* Trigger Button on Mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-extrabold shadow-sm hover:bg-black transition-all cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Slide-Over Bottom Sheet / Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-h-[88vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull-down drag indicator */}
            <div className="pt-2 pb-1 flex justify-center">
              <div className="sheet-drag-handle" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Filter & Refine</h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
              {/* Style Quiz banner */}
              <Link
                href="/quiz"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold">Take 60s Style Quiz</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700">Start →</span>
              </Link>

              {/* Accordion 1: Gender */}
              {genderGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("gender")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{genderGroup.title}</span>
                    {openSections.gender ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.gender && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {genderGroup.options.map((opt) => {
                        const isChecked = filters.gender.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => toggleFilter("gender", opt.id)}
                            className={cn(
                              "p-2 rounded-xl border text-xs font-bold flex items-center justify-between",
                              opt.disabled ? "opacity-30 border-slate-100" : isChecked ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-700"
                            )}
                          >
                            <span>{opt.label}</span>
                            <span className="text-[10px] opacity-70">({opt.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 2: Shape */}
              {shapeGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("shape")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{shapeGroup.title}</span>
                    {openSections.shape ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.shape && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {shapeGroup.options.map((opt) => {
                        const isChecked = filters.shape.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => toggleFilter("shape", opt.id)}
                            className={cn(
                              "p-2 rounded-xl border text-center flex flex-col items-center",
                              opt.disabled ? "opacity-30 border-slate-100" : isChecked ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-800"
                            )}
                          >
                            {opt.svgShape && (
                              <svg
                                viewBox="0 0 120 60"
                                className={cn("w-10 h-5 mb-1", isChecked ? "text-white" : "text-slate-700")}
                                dangerouslySetInnerHTML={{ __html: opt.svgShape }}
                              />
                            )}
                            <span className="text-xs font-bold capitalize">{opt.label}</span>
                            <span className="text-[9px] opacity-70">({opt.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 3: Fit */}
              {fitGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("fit")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{fitGroup.title}</span>
                    {openSections.fit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.fit && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {fitGroup.options.map((opt) => {
                        const isChecked = filters.fit.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => toggleFilter("fit", opt.id)}
                            className={cn(
                              "p-2 rounded-xl border text-xs font-bold text-center",
                              opt.disabled ? "opacity-30 border-slate-100" : isChecked ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-700"
                            )}
                          >
                            <div>{opt.label}</div>
                            <div className="text-[9px] font-normal opacity-70">({opt.count})</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 4: Color */}
              {colorGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("color")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{colorGroup.title}</span>
                    {openSections.color ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.color && (
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {colorGroup.options.map((opt) => {
                        const isChecked = filters.color.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => toggleFilter("color", opt.id)}
                            className={cn("flex flex-col items-center", opt.disabled && "opacity-30")}
                          >
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full border flex items-center justify-center",
                                isChecked ? "ring-2 ring-slate-900 ring-offset-2 scale-110" : "border-black/15"
                              )}
                              style={{ backgroundColor: opt.colorHex }}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-[8px] font-medium text-slate-600 truncate max-w-[48px] text-center mt-1">
                              {opt.label.split(" ")[0]}
                            </span>
                            <span className="text-[8px] text-slate-400">({opt.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 5: Material */}
              {materialGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("material")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{materialGroup.title}</span>
                    {openSections.material ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.material && (
                    <div className="mt-2 space-y-1">
                      {materialGroup.options.map((opt) => {
                        const isChecked = filters.material.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs",
                              opt.disabled ? "opacity-30" : isChecked ? "bg-slate-100 font-bold" : "text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={opt.disabled}
                                onChange={() => toggleFilter("material", opt.id)}
                                className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                              />
                              <span>{opt.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">({opt.count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 6: Prescription */}
              {prescriptionGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("prescription")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{prescriptionGroup.title}</span>
                    {openSections.prescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.prescription && (
                    <div className="mt-2 space-y-1">
                      {prescriptionGroup.options.map((opt) => {
                        const isChecked = filters.prescription.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs",
                              opt.disabled ? "opacity-30" : isChecked ? "bg-slate-100 font-bold" : "text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={opt.disabled}
                                onChange={() => toggleFilter("prescription", opt.id)}
                                className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                              />
                              <span>{opt.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">({opt.count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 7: Vibe */}
              {vibeGroup && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("vibe")}
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                  >
                    <span>{vibeGroup.title}</span>
                    {openSections.vibe ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections.vibe && (
                    <div className="mt-2 space-y-1">
                      {vibeGroup.options.map((opt) => {
                        const isChecked = filters.vibe.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs",
                              opt.disabled ? "opacity-30" : isChecked ? "bg-slate-100 font-bold" : "text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={opt.disabled}
                                onChange={() => toggleFilter("vibe", opt.id)}
                                className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                              />
                              <span>{opt.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">({opt.count})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 8: Price */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => toggleSection("price")}
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 uppercase"
                >
                  <span>Price Range (PKR)</span>
                  {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSections.price && (
                  <div className="mt-3 space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Rs. {localMinPrice.toLocaleString()}</span>
                      <span>Rs. {localMaxPrice.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="15000"
                      step="500"
                      value={localMinPrice}
                      onChange={handleMinPriceChange}
                      className="w-full accent-slate-900"
                    />
                    <input
                      type="range"
                      min="5000"
                      max="30000"
                      step="1000"
                      value={localMaxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-full accent-slate-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-md"
              >
                View {totalResults} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
