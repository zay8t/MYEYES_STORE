"use client";

import React from "react";
import { Eye, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type VisionType = "single_vision" | "progressive";

export interface Step1VisionTypeProps {
  visionType: VisionType;
  onChangeVisionType: (type: VisionType) => void;
  age: string;
  onChangeAge: (age: string) => void;
}

export function Step1VisionType({
  visionType,
  onChangeVisionType,
  age,
  onChangeAge,
}: Step1VisionTypeProps) {
  const isProgressive = visionType === "progressive";
  const parsedAge = parseInt(age || "0", 10);
  const showAgeAdvisory = parsedAge >= 40 && !isProgressive;

  return (
    <div className="p-6 sm:p-8 border-b border-neutral-100">
      {/* Step Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
          <Eye className="w-4.5 h-4.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
            Step 1 — What will you use these glasses for?
          </h2>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Choose the option that fits your daily needs.
          </p>
        </div>
      </div>

      {/* Vision Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: STANDARD VISION LENS (EVERYDAY SINGLE WEAR) */}
        <button
          type="button"
          onClick={() => onChangeVisionType("single_vision")}
          className={cn(
            "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs",
            !isProgressive
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/15"
              : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          {!isProgressive && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-2xs">
              <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
            </span>
          )}
          <div className="text-sm font-extrabold text-neutral-900 mb-1.5 leading-snug tracking-tight">
            STANDARD VISION LENS (EVERYDAY SINGLE WEAR)
          </div>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            For distance, reading, or screen use. One single power throughout the lens.
          </p>
          <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200/60">
            ONE FOCUS
          </span>
        </button>

        {/* Card 2: PROGRESSIVE (TWO IN 1 NEAR AND FAR) */}
        <button
          type="button"
          onClick={() => onChangeVisionType("progressive")}
          className={cn(
            "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs",
            isProgressive
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/15"
              : "border-neutral-200 bg-white hover:border-neutral-300"
          )}
        >
          {isProgressive && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-2xs">
              <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
            </span>
          )}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-neutral-900 leading-snug tracking-tight">
              PROGRESSIVE (TWO IN 1 NEAR AND FAR)
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Age 40+
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            See clearly far away and read up close without changing your glasses. Ideal for age 40+.
          </p>
          <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/60">
            FAR + SCREEN + READING
          </span>
        </button>
      </div>

      {/* Optional Age Input Field */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2">
            Your Age <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={age}
            onChange={(e) => onChangeAge(e.target.value)}
            placeholder="e.g. 42"
            className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold transition-all outline-none"
          />
        </div>
        {showAgeAdvisory && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 self-end">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong>Age {parsedAge}:</strong> Most people around 40+ find all-in-one progressive lenses most comfortable for reading and distance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step1VisionType;
