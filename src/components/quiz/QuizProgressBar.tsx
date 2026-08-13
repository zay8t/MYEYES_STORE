"use client";

import React from "react";
import { TOTAL_STEPS } from "@/lib/quizData";

interface QuizProgressBarProps {
  currentStep: number;
}

export default function QuizProgressBar({ currentStep }: QuizProgressBarProps) {
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1 px-4">
      {/* Step counter */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="text-[#F59E0B] font-extrabold">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
        <span className="text-slate-300">•</span>
        <span>{percent}% Completed</span>
      </div>

      {/* Progress track */}
      <div className="relative w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
        {/* Glowing tip */}
        {percent > 0 && percent < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(245,158,11,0.6)] transition-all duration-500"
            style={{ left: `calc(${percent}% - 6px)` }}
          />
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`rounded-full transition-all duration-300 ${
              step < currentStep
                ? "w-2 h-2 bg-amber-500"
                : step === currentStep
                ? "w-3 h-3 bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                : "w-1.5 h-1.5 bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
