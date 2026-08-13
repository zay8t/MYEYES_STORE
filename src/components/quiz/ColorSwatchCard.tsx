"use client";

import React from "react";
import { QuizOption } from "@/lib/quizData";

interface ColorSwatchCardProps {
  option: QuizOption;
  selected: boolean;
  onSelect: () => void;
}

export default function ColorSwatchCard({ option, selected, onSelect }: ColorSwatchCardProps) {
  const colors = option.swatchColors || ["#888"];

  return (
    <button
      onClick={onSelect}
      className={`
        relative w-full flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer
        transition-all duration-200 text-left group
        ${selected
          ? "border-[#F59E0B] bg-amber-50/30 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
          : "border-slate-200 bg-white hover:border-[#F59E0B] hover:shadow-md hover:-translate-y-0.5"
        }
      `}
    >
      {/* Selected tick */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Color Swatch Grid */}
      <div className="flex items-center gap-1.5">
        {colors.map((color, idx) => (
          <div
            key={idx}
            className={`
              w-8 h-8 rounded-full border-2 transition-all duration-200 shadow-sm
              ${selected ? "border-amber-300 scale-110" : "border-white group-hover:scale-105"}
            `}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="text-center space-y-0.5">
        <div className={`text-xs font-bold transition-colors leading-snug ${selected ? "text-[#D97706]" : "text-slate-800"}`}>
          {option.label}
        </div>
        {option.sublabel && (
          <div className="text-[10px] text-slate-500 font-medium">{option.sublabel}</div>
        )}
      </div>
    </button>
  );
}
