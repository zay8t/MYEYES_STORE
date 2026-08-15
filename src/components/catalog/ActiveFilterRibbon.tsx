"use client";

import React from "react";
import { X, RotateCcw, ArrowUpDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCatalogFilters } from "@/lib/hooks/useCatalogFilters";
import { COLOR_SWATCH_DEFINITIONS } from "@/lib/catalog/facetAggregator";

interface ActiveFilterRibbonProps {
  totalResults: number;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured & Bestsellers" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
];

export default function ActiveFilterRibbon({ totalResults }: ActiveFilterRibbonProps) {
  const {
    filters,
    activeFilterCount,
    removeFilterValue,
    clearFilterKey,
    resetFilters,
    setSort,
    isPending,
  } = useCatalogFilters();

  if (activeFilterCount === 0 && !filters.sort) {
    return (
      <div className="flex items-center justify-between py-3 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-slate-500">
            Showing <strong className="text-slate-900">{totalResults}</strong> frames
          </p>
          <Link
            href="/quiz"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Take 60s Style Quiz</span>
          </Link>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs text-slate-400 font-medium hidden sm:inline">
            Sort by:
          </label>
          <div className="relative">
            <select
              id="catalog-sort"
              value={filters.sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-slate-900"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 mb-6 border-b border-slate-100 space-y-3">
      {/* Top row: Counter & Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-slate-500">
            Showing <strong className="text-slate-900">{totalResults}</strong> matching frames
            {isPending && <span className="ml-2 text-[10px] text-amber-600 font-semibold animate-pulse">Updating...</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort-active" className="text-xs text-slate-400 font-medium hidden sm:inline">
            Sort:
          </label>
          <div className="relative">
            <select
              id="catalog-sort-active"
              value={filters.sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-slate-900"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Gender chips */}
          {filters.gender.map((g) => (
            <span
              key={`gender-${g}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{g}</span>
              <button
                type="button"
                onClick={() => removeFilterValue("gender", g)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${g}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Shape chips */}
          {filters.shape.map((s) => (
            <span
              key={`shape-${s}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{s.replace("_", " ")}</span>
              <button
                type="button"
                onClick={() => removeFilterValue("shape", s)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${s}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Fit chips */}
          {filters.fit.map((f) => (
            <span
              key={`fit-${f}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{f.replace("_", " ")} Width</span>
              <button
                type="button"
                onClick={() => removeFilterValue("fit", f)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${f}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Material chips */}
          {filters.material.map((m) => (
            <span
              key={`material-${m}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{m}</span>
              <button
                type="button"
                onClick={() => removeFilterValue("material", m)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${m}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Prescription chips */}
          {filters.prescription.map((rx) => (
            <span
              key={`rx-${rx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{rx.replace("_", " ")}</span>
              <button
                type="button"
                onClick={() => removeFilterValue("prescription", rx)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${rx}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Color chips */}
          {filters.color.map((c) => {
            const swatch = COLOR_SWATCH_DEFINITIONS.find((s) => s.id === c);
            return (
              <span
                key={`color-${c}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
              >
                {swatch?.colorHex && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ backgroundColor: swatch.colorHex }}
                  />
                )}
                <span>{swatch?.label || c}</span>
                <button
                  type="button"
                  onClick={() => removeFilterValue("color", c)}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                  title={`Remove ${c}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* Vibe chips */}
          {filters.vibe.map((v) => (
            <span
              key={`vibe-${v}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in"
            >
              <span className="capitalize">{v.replace("_", " ")}</span>
              <button
                type="button"
                onClick={() => removeFilterValue("vibe", v)}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title={`Remove ${v}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Price range chip */}
          {(filters.minPrice > 1000 || filters.maxPrice < 30000) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs animate-fade-in">
              <span>
                Rs. {filters.minPrice.toLocaleString()} – Rs. {filters.maxPrice.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearFilterKey("minPrice");
                  clearFilterKey("maxPrice");
                }}
                className="hover:text-amber-400 transition-colors cursor-pointer"
                title="Reset price range"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Reset All Button */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all</span>
          </button>
        </div>
      )}
    </div>
  );
}
