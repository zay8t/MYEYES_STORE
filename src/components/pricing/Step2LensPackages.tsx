"use client";

import React from "react";
import { BookOpen, RefreshCw, Check } from "lucide-react";
import { LensPricingTier } from "@/hooks/useLensPricing";
import { cn } from "@/lib/utils";

export interface Step2LensPackagesProps {
  packages: LensPricingTier[];
  selectedLensId: string;
  onSelectLensId: (id: string) => void;
  isProgressive: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Step2LensPackages({
  packages,
  selectedLensId,
  onSelectLensId,
  isProgressive,
  onRefresh,
  isLoading = false,
}: Step2LensPackagesProps) {
  const activePackages = isProgressive
    ? packages.filter((p) => p.id !== "sv-167-shmc")
    : packages;

  return (
    <div className="p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Step 2 — Choose Your Lens
            </h2>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Select the features you want for your lenses. Prices dynamically update based on active vision mode.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh live pricing from database"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-600 hover:text-amber-700 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-amber-600")} />
            <span>Live Rates</span>
          </button>
        )}
      </div>

      {/* Package Grid */}
      <div
        className={cn(
          "grid gap-3",
          isProgressive
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {activePackages.slice(0, isProgressive ? 4 : 3).map((pkg) => {
          const isSelected = selectedLensId === pkg.id;
          const startingPrice = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectLensId(pkg.id)}
              className={cn(
                "relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 w-full flex flex-col justify-between",
                isSelected
                  ? "border-amber-500 bg-white ring-2 ring-amber-500/15"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-2xs">
                  <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                </span>
              )}
              <div>
                <div className="text-xs font-extrabold text-neutral-900 mb-1 leading-tight pr-6">
                  {pkg.cleanName || pkg.name}
                </div>
                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg inline-block mb-2">
                  From Rs. {startingPrice.toLocaleString()}/-
                </div>
                <p className="text-[11px] text-neutral-500 font-normal leading-relaxed line-clamp-2">
                  {pkg.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                <span>{pkg.index} Index</span>
                <span>{pkg.badge}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Remaining Packages for Single Vision (B4 & B5) */}
      {!isProgressive && activePackages.slice(3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
          {activePackages.slice(3).map((pkg) => {
            const isSelected = selectedLensId === pkg.id;
            const startingPrice = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => onSelectLensId(pkg.id)}
                className={cn(
                  "relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 w-full flex flex-col justify-between",
                  isSelected
                    ? "border-amber-500 bg-white ring-2 ring-amber-500/15"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                  </span>
                )}
                <div>
                  <div className="text-xs font-extrabold text-neutral-900 mb-1 leading-tight pr-6">
                    {pkg.cleanName || pkg.name}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg inline-block mb-2">
                    From Rs. {startingPrice.toLocaleString()}/-
                  </div>
                  <p className="text-[11px] text-neutral-500 font-normal leading-relaxed line-clamp-2">
                    {pkg.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                  <span>{pkg.index} Index</span>
                  <span>{pkg.badge}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Step2LensPackages;
