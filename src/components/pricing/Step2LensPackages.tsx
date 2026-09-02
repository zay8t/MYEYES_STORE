"use client";

import React from "react";
import { RefreshCw, Check, ArrowRight } from "lucide-react";
import { LensPricingTier } from "@/hooks/useLensPricing";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface Step2LensPackagesProps {
  packages: LensPricingTier[];
  selectedLensId: string;
  onSelectLensId: (id: string) => void;
  isProgressive: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Customer-friendly feature bullets per tier (no raw optical jargon)
const TIER_FEATURES: Record<string, string[]> = {
  "progressive-freeform": [
    "Standard clarity for everyday wear",
    "Scratch-resistant hard coating",
    "Best for mild prescriptions (0 to ±2.00)",
  ],
  "sv-156-bluecut": [
    "Blocks harmful digital screen blue light",
    "100% UV ray protection",
    "Anti-glare coating included",
    "Good for screens & daily use (0 to ±3.00)",
  ],
  "sv-156-photogrey": [
    "Automatically darkens in sunlight",
    "Full UV protection outdoors",
    "Clear again when you go inside",
    "Great for driving & outdoor use",
  ],
  "sv-156-photogrey-bluecut": [
    "Blue light filter indoors",
    "Auto-darkens into sunglasses outdoors",
    "Maximum protection in one lens",
    "Perfect for screens & outdoor life",
  ],
  "sv-167-shmc": [
    "Ultra-thin — up to 35% slimmer profile",
    "Ideal for strong prescriptions (±3.50 to ±8.00+)",
    "Anti-reflective super hydrophobic coating",
    "Looks great in any frame style",
  ],
};

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
    <div className="p-5 sm:p-8 border-b border-neutral-100 bg-neutral-50/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
            Step 2 — Pick Your Lens
          </h2>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Choose the features you want. Tap a card to select — price updates below.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh live pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-600 hover:text-amber-700 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-amber-600")} />
            <span>Live Rates</span>
          </button>
        )}
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {activePackages.map((pkg) => {
          const isSelected = selectedLensId === pkg.id;
          const startingPrice = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
          const features = TIER_FEATURES[pkg.id] ?? [pkg.description];
          const ctaHref = `/eyeglasses?visionType=${isProgressive ? "progressive" : "single_vision"}&lens=${pkg.id}`;

          return (
            <div
              key={pkg.id}
              className={cn(
                "relative rounded-2xl border-2 bg-white flex flex-col transition-all duration-200 cursor-pointer shadow-sm overflow-hidden group",
                isSelected
                  ? "border-amber-500 ring-2 ring-amber-500/15"
                  : "border-neutral-200 hover:border-neutral-300 hover:-translate-y-0.5"
              )}
              onClick={() => onSelectLensId(pkg.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectLensId(pkg.id)}
              aria-pressed={isSelected}
            >
              {/* Selected check */}
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-sm z-10">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              )}

              {/* Card body */}
              <div className="p-4 flex-1">
                {/* Tier name */}
                <div className="text-xs font-extrabold text-neutral-900 mb-1 leading-tight pr-7">
                  {pkg.cleanName || pkg.name}
                </div>

                {/* Price badge */}
                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg inline-block mb-3">
                  From Rs. {startingPrice.toLocaleString()}/-
                </div>

                {/* Customer-friendly feature list */}
                <ul className="space-y-1.5">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-neutral-600 font-normal leading-snug">
                      <span className="w-3.5 h-3.5 mt-px rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[8px] font-black">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card footer */}
              <div className="border-t border-neutral-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {pkg.reductionTag || pkg.badge}
                </span>
                {/* Direct "Choose Frame" CTA — stops card click propagation */}
                <Link
                  href={ctaHref}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-[10px] font-bold text-white transition-colors"
                  aria-label={`Choose frame with ${pkg.cleanName || pkg.name}`}
                >
                  Choose Frame
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Step2LensPackages;
