"use client";

import React from "react";
import { QuizOption } from "@/lib/quizData";

interface ShapeCardProps {
  option: QuizOption;
  selected: boolean;
  onSelect: () => void;
}

export default function ShapeCard({ option, selected, onSelect }: ShapeCardProps) {
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

      {/* SVG Silhouette */}
      <div className={`w-full transition-colors duration-200 ${selected ? "text-[#D97706]" : "text-slate-400 group-hover:text-[#F59E0B]"}`}>
        <svg
          viewBox="0 0 120 60"
          className="w-full max-w-[160px] mx-auto h-[64px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: option.svgPath || "" }}
        />
      </div>

      {/* Labels */}
      <div className="text-center space-y-0.5">
        <div className={`text-sm font-bold transition-colors ${selected ? "text-[#D97706]" : "text-slate-800"}`}>
          {option.label}
        </div>
        {option.sublabel && (
          <div className="text-[11px] text-slate-500 font-medium">{option.sublabel}</div>
        )}
        {option.hint && (
          <div className={`text-[10px] font-semibold mt-1 ${selected ? "text-amber-600" : "text-slate-400"}`}>
            {option.hint}
          </div>
        )}
      </div>
    </button>
  );
}
