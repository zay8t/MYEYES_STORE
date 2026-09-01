"use client";

import React from "react";
import { Calculator, Eye, Sparkles, BookOpen, Info, Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EyeRx {
  sph: string;
  cyl: string;
  axis: string;
}

export interface Step3PrescriptionProps {
  od: EyeRx;
  os: EyeRx;
  odAdd: string;
  osAdd: string;
  addLinked: boolean;
  noRxFallback: boolean;
  isProgressive: boolean;
  effectiveAdd: number;
  onSetEye: (eye: "od" | "os", field: keyof EyeRx, value: string) => void;
  onSetAdd: (which: "od" | "os", value: string) => void;
  onToggleAddLinked: () => void;
  onToggleNoRxFallback: () => void;
}

export const SPH_MINUS = Array.from({ length: 48 }, (_, i) => (-12.0 + i * 0.25).toFixed(2)).reverse();
export const SPH_PLUS = Array.from({ length: 64 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
export const SPH_ALL = [...SPH_MINUS, "+0.00", ...SPH_PLUS];
export const CYL_MINUS = Array.from({ length: 24 }, (_, i) => (-6.0 + i * 0.25).toFixed(2)).reverse();
export const CYL_PLUS = Array.from({ length: 16 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
export const CYL_ALL = [...CYL_MINUS, "+0.00", ...CYL_PLUS];
export const ADD_OPTIONS = Array.from({ length: 12 }, (_, i) => `+${(0.75 + i * 0.25).toFixed(2)}`);
export const AXIS_OPTIONS = Array.from({ length: 180 }, (_, i) => String(i + 1));

export function formatDiopter(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return "+0.00";
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

export function toggleSign(v: string, sign: "+" | "-"): string {
  return `${sign}${Math.abs(parseFloat(v) || 0).toFixed(2)}`;
}

export function getSign(v: string): "+" | "-" {
  return String(v || "").trim().startsWith("-") ? "-" : "+";
}

interface PrescriptionInputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  isAxis?: boolean;
  disabled?: boolean;
}

export function PrescriptionInputGroup({
  label,
  value,
  onChange,
  options,
  isAxis = false,
  disabled = false,
}: PrescriptionInputGroupProps) {
  const sign = getSign(value);

  return (
    <div className={cn("space-y-2", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center justify-between min-h-[32px] gap-1">
        <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase truncate">
          {label}
        </label>
        {!isAxis && (
          <div className="inline-flex rounded-xl p-0.5 sm:p-1 bg-neutral-100 border border-neutral-200/60 text-xs shadow-2xs shrink-0">
            {(["+", "-"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(toggleSign(value, s))}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
                  sign === s
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 font-medium"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <select
        value={isAxis ? value : formatDiopter(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-neutral-900 text-sm font-mono font-bold transition-all outline-none"
      >
        {isAxis ? (
          options.map((o) => (
            <option key={o} value={o}>
              {o}&deg;
            </option>
          ))
        ) : (
          <>
            <optgroup label="Minus (-) Diopters">
              {options
                .filter((o) => o.startsWith("-"))
                .map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Plano / Zero">
              <option value="+0.00">0.00 (Plano)</option>
            </optgroup>
            <optgroup label="Plus (+) Diopters">
              {options
                .filter((o) => o.startsWith("+") && o !== "+0.00")
                .map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </optgroup>
          </>
        )}
      </select>
    </div>
  );
}

export function Step3Prescription({
  od,
  os,
  odAdd,
  osAdd,
  addLinked,
  noRxFallback,
  isProgressive,
  effectiveAdd,
  onSetEye,
  onSetAdd,
  onToggleAddLinked,
  onToggleNoRxFallback,
}: Step3PrescriptionProps) {
  return (
    <div className="p-6 sm:p-8 border-b border-neutral-100">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
            <Calculator className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Step 3 — Enter Your Eye Numbers
            </h2>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Copy the numbers from your prescription slip.
              {isProgressive ? " Reading number (ADD) required for all-in-one lenses." : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleNoRxFallback}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
            noRxFallback
              ? "bg-amber-500/10 border-amber-500/40 text-amber-700"
              : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {noRxFallback ? "Using Estimated Numbers" : "Don't have your slip?"}
        </button>
      </div>

      {/* Fallback info */}
      {noRxFallback && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 font-medium">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Using estimated numbers:</strong>{" "}
            {isProgressive
              ? "Standard baseline applied with entry reading addition (+1.50). Your final price may adjust when you enter your slip."
              : "Standard baseline applied (zero power). Enter your actual slip numbers for your exact price."}
          </span>
        </div>
      )}

      {isProgressive && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 font-medium">
          <strong>Pupillary Distance (PD):</strong> For all-in-one lenses, our team will message you on WhatsApp after your order to help measure your eye distance easily.
        </div>
      )}

      {/* Eye Input Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Eye (OD) */}
        <div
          className={cn(
            "p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4",
            noRxFallback && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-3">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
              Right Eye (OD)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <PrescriptionInputGroup
              label="POWER (SPH)"
              value={od.sph}
              onChange={(v) => onSetEye("od", "sph", v)}
              options={SPH_ALL}
              disabled={noRxFallback}
            />
            <PrescriptionInputGroup
              label="CYLINDER (CYL)"
              value={od.cyl}
              onChange={(v) => onSetEye("od", "cyl", v)}
              options={CYL_ALL}
              disabled={noRxFallback}
            />
          </div>
          <PrescriptionInputGroup
            label="AXIS"
            value={od.axis}
            onChange={(v) => onSetEye("od", "axis", v)}
            options={AXIS_OPTIONS}
            isAxis
            disabled={noRxFallback}
          />
        </div>

        {/* Left Eye (OS) */}
        <div
          className={cn(
            "p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4",
            noRxFallback && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-3">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
              Left Eye (OS)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <PrescriptionInputGroup
              label="POWER (SPH)"
              value={os.sph}
              onChange={(v) => onSetEye("os", "sph", v)}
              options={SPH_ALL}
              disabled={noRxFallback}
            />
            <PrescriptionInputGroup
              label="CYLINDER (CYL)"
              value={os.cyl}
              onChange={(v) => onSetEye("os", "cyl", v)}
              options={CYL_ALL}
              disabled={noRxFallback}
            />
          </div>
          <PrescriptionInputGroup
            label="AXIS"
            value={os.axis}
            onChange={(v) => onSetEye("os", "axis", v)}
            options={AXIS_OPTIONS}
            isAxis
            disabled={noRxFallback}
          />
        </div>
      </div>

      {/* Conditional ADD Block for Progressive */}
      {isProgressive && (
        <div className="mt-6 p-5 rounded-2xl border-2 border-amber-400/40 bg-amber-50/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Reading Number (ADD) — All-in-One Only
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleAddLinked}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer",
                addLinked
                  ? "bg-emerald-50 border-emerald-300/70 text-emerald-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {addLinked ? (
                <>
                  <Link2 className="w-3.5 h-3.5" /> Both Eyes Same
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5" /> Set Separately
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-amber-800/70 font-normal leading-relaxed">
            Reading addition (+0.75 to +3.50). Usually the same for both eyes. Toggle{" "}
            <strong>Set Separately</strong> to adjust each eye independently if needed.
          </p>
          <div className={cn("grid gap-4", addLinked ? "grid-cols-1 max-w-xs" : "grid-cols-1 sm:grid-cols-2")}>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                {addLinked ? "Reading Number (ADD)" : "Right Eye — Reading Number"}
              </label>
              <select
                value={noRxFallback ? "+1.50" : odAdd}
                onChange={(e) => onSetAdd("od", e.target.value)}
                disabled={noRxFallback}
                className={cn(
                  "w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none",
                  noRxFallback && "opacity-50"
                )}
              >
                {ADD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {!addLinked && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                  Left Eye — Reading Number
                </label>
                <select
                  value={noRxFallback ? "+1.50" : osAdd}
                  onChange={(e) => onSetAdd("os", e.target.value)}
                  disabled={noRxFallback}
                  className={cn(
                    "w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none",
                    noRxFallback && "opacity-50"
                  )}
                >
                  {ADD_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!addLinked && (
            <p className="text-[10px] text-amber-700 font-medium">
              Average reading addition: <strong>+{effectiveAdd.toFixed(2)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Step3Prescription;
