"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tag, Calculator, Eye, AlertCircle, ArrowRight, ShieldCheck,
  Sparkles, Check, BookOpen, ChevronRight, Unlink, Link2, Info,
} from "lucide-react";
import {
  calculateTotalLensPrice,
  calculateTotalProgressivePrice,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
} from "@/lib/pricingEngine";
import { formatPrice, cn } from "@/lib/utils";
import LensThicknessSimulator from "@/components/pricing/LensThicknessSimulator";
import { LENS_PACKAGES, LensPackageDefinition } from "@/lib/prescription-pricing";

type VisionType = "single_vision" | "progressive";

interface EyeRx { sph: string; cyl: string; axis: string; }

interface WizardState {
  visionType: VisionType;
  age: string;
  selectedLensId: string;
  od: EyeRx;
  os: EyeRx;
  odAdd: string;
  osAdd: string;
  addLinked: boolean;
  noRxFallback: boolean;
}

const CORE_PROGRESSIVE_LENSES = LENS_PACKAGES.filter(
  (p) => p.id !== "sv-167-shmc"
) as LensPackageDefinition[];

const SPH_MINUS = Array.from({ length: 48 }, (_, i) => (-12.0 + i * 0.25).toFixed(2)).reverse();
const SPH_PLUS  = Array.from({ length: 64 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
const SPH_ALL   = [...SPH_MINUS, "+0.00", ...SPH_PLUS];
const CYL_MINUS = Array.from({ length: 24 }, (_, i) => (-6.0 + i * 0.25).toFixed(2)).reverse();
const CYL_PLUS  = Array.from({ length: 16 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
const CYL_ALL   = [...CYL_MINUS, "+0.00", ...CYL_PLUS];
const ADD_OPTIONS = Array.from({ length: 12 }, (_, i) => `+${(0.75 + i * 0.25).toFixed(2)}`);
const AXIS_OPTIONS = Array.from({ length: 180 }, (_, i) => String(i + 1));

function formatDiopter(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return "+0.00";
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}
function toggleSign(v: string, sign: "+" | "-"): string {
  return `${sign}${Math.abs(parseFloat(v) || 0).toFixed(2)}`;
}
function getSign(v: string): "+" | "-" {
  return String(v || "").trim().startsWith("-") ? "-" : "+";
}
function parsePow(v: string): number {
  const n = parseFloat(v); return isNaN(n) ? 0 : n;
}

interface PIGProps {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; isAxis?: boolean; disabled?: boolean;
}

function PrescriptionInputGroup({ label, value, onChange, options, isAxis = false, disabled = false }: PIGProps) {
  const sign = getSign(value);
  return (
    <div className={cn("space-y-2", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">{label}</label>
        {!isAxis && (
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 border border-neutral-200/60 text-xs shadow-2xs">
            {(["+", "-"] as const).map((s) => (
              <button key={s} type="button" onClick={() => onChange(toggleSign(value, s))}
                className={cn("px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
                  sign === s ? "bg-amber-500 text-slate-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900 font-medium"
                )}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <select value={isAxis ? value : formatDiopter(value)} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-mono font-bold transition-all outline-none">
        {isAxis ? (
          options.map((o) => <option key={o} value={o}>{o}&deg;</option>)
        ) : (
          <>
            <optgroup label="Minus (-) Diopters">
              {options.filter((o) => o.startsWith("-")).map((o) => <option key={o} value={o}>{o}</option>)}
            </optgroup>
            <optgroup label="Plano / Zero"><option value="+0.00">+0.00 (Plano)</option></optgroup>
            <optgroup label="Plus (+) Diopters">
              {options.filter((o) => o.startsWith("+") && o !== "+0.00").map((o) => <option key={o} value={o}>{o}</option>)}
            </optgroup>
          </>
        )}
      </select>
    </div>
  );
}

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black bg-amber-500 text-slate-950 border border-amber-500 shadow-xs">{step}</span>
      <span className="hidden sm:block">{label}</span>
    </div>
  );
}

function LensCard({ lens, selected, basePrices, onClick }: {
  lens: LensPackageDefinition; selected: boolean; basePrices: BasePriceConfig; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn("relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 w-full",
        selected ? "border-amber-500 bg-white ring-2 ring-amber-500/15" : "border-neutral-200 bg-white hover:border-neutral-300"
      )}>
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-slate-950" />
        </span>
      )}
      <div className="text-xs font-extrabold text-neutral-900 mb-1 leading-tight pr-6">{lens.name}</div>
      <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg inline-block mb-2">
        From Rs. {(basePrices[lens.baseKey as keyof BasePriceConfig] || 0).toLocaleString()}/-
      </div>
      <p className="text-[11px] text-neutral-500 font-normal leading-relaxed line-clamp-2">{lens.description}</p>
    </button>
  );
}

export default function LensPricingPage() {
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);

  useEffect(() => {
    fetch("/api/base-prices", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setBasePrices(d); })
      .catch(() => {});
  }, []);

  const [state, setState] = useState<WizardState>({
    visionType: "single_vision",
    age: "",
    selectedLensId: "sv-156-bluecut",
    od: { sph: "-2.00", cyl: "-0.50", axis: "90" },
    os: { sph: "-2.00", cyl: "-0.50", axis: "90" },
    odAdd: "+1.50",
    osAdd: "+1.50",
    addLinked: true,
    noRxFallback: false,
  });

  const set = useCallback(<K extends keyof WizardState>(k: K, v: WizardState[K]) => {
    setState((p) => ({ ...p, [k]: v }));
  }, []);

  const setEye = useCallback((eye: "od" | "os", field: keyof EyeRx, v: string) => {
    setState((p) => ({ ...p, [eye]: { ...p[eye], [field]: v } }));
  }, []);

  const setAdd = useCallback((which: "od" | "os", v: string) => {
    setState((p) => p.addLinked ? { ...p, odAdd: v, osAdd: v } : { ...p, [`${which}Add`]: v });
  }, []);

  useEffect(() => {
    if (state.visionType === "progressive" && state.selectedLensId === "sv-167-shmc") {
      set("selectedLensId", "progressive-freeform");
    }
  }, [state.visionType, state.selectedLensId, set]);

  const isProgressive = state.visionType === "progressive";
  const parsedAge = parseInt(state.age || "0", 10);
  const showAgeAdvisory = parsedAge >= 40;
  const activeLenses = isProgressive ? CORE_PROGRESSIVE_LENSES : LENS_PACKAGES;

  const effOd = state.noRxFallback ? { sph: "+0.00", cyl: "+0.00", axis: "90" } : state.od;
  const effOs = state.noRxFallback ? { sph: "+0.00", cyl: "+0.00", axis: "90" } : state.os;
  const effOdAdd = state.noRxFallback ? "+1.50" : state.odAdd;
  const effOsAdd = state.noRxFallback ? "+1.50" : state.osAdd;

  const parsedOdAdd = parsePow(effOdAdd);
  const parsedOsAdd = parsePow(effOsAdd);
  const effectiveAdd = state.addLinked ? parsedOdAdd : (parsedOdAdd + parsedOsAdd) / 2;

  const parsedOdSph = parsePow(effOd.sph);
  const parsedOdCyl = parsePow(effOd.cyl);
  const parsedOsSph = parsePow(effOs.sph);
  const parsedOsCyl = parsePow(effOs.cyl);

  const result = useMemo(() => {
    if (isProgressive) {
      return calculateTotalProgressivePrice(
        state.selectedLensId,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        effectiveAdd, basePrices
      );
    }
    return calculateTotalLensPrice(
      state.selectedLensId,
      { sph: parsedOdSph, cyl: parsedOdCyl },
      { sph: parsedOsSph, cyl: parsedOsCyl },
      basePrices
    );
  }, [isProgressive, state.selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, effectiveAdd, basePrices]);

  const selectedPkg = useMemo(
    () => LENS_PACKAGES.find((p) => p.id === state.selectedLensId) ?? LENS_PACKAGES[1],
    [state.selectedLensId]
  );

  const ctaHref = useMemo(() => {
    const p = new URLSearchParams({ visionType: state.visionType });
    if (isProgressive) p.set("add", effectiveAdd.toFixed(2));
    if (state.selectedLensId) p.set("lens", state.selectedLensId);
    return `/eyeglasses?${p.toString()}`;
  }, [state.visionType, state.selectedLensId, isProgressive, effectiveAdd]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-neutral-50/50 py-12 sm:py-16 text-neutral-900 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto border-b border-neutral-200/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold uppercase tracking-widest text-amber-700">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            MY EYES Precision Lens Pricing Wizard
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
            Prescription Lens Pricing
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mx-auto font-normal">
            Transparent, dynamic pricing from MY EYES Precision Labs. Enter your prescription and get an exact price — what you see here is exactly what you pay at checkout.
          </p>
          {isProgressive && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Presbyopia Progressive Calculator Active</span>
            </div>
          )}
        </div>

        {/* Step Navigator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-1">
          <StepBadge step={1} label="Vision Intent" />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={2} label="Lens Tier" />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={3} label={isProgressive ? "Rx & ADD Power" : "Rx Powers"} />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={4} label="Live Pricing" />
        </div>

        {/* Main Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden">

          {/* STEP 1: Vision Intent */}
          <div className="p-6 sm:p-8 border-b border-neutral-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">Step 1 — Vision Type &amp; Patient Profile</h2>
                <p className="text-xs text-neutral-500 font-normal mt-0.5">Select your vision correction intent. This controls which packages and ADD fields appear.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={() => set("visionType", "single_vision")}
                className={cn("relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                  !isProgressive ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/15" : "border-neutral-200 bg-white hover:border-neutral-300"
                )}>
                {!isProgressive && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><Check className="w-3 h-3 text-slate-950" /></span>}
                <div className="text-sm font-extrabold text-neutral-900 mb-1.5">Standard Single Vision</div>
                <p className="text-xs text-neutral-500 font-normal leading-relaxed">For myopia, hyperopia, or astigmatism. Single correction power across the entire lens. No ADD power required.</p>
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-lg">Distance or Reading</span>
              </button>

              <button type="button" onClick={() => set("visionType", "progressive")}
                className={cn("relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                  isProgressive ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/15" : "border-neutral-200 bg-white hover:border-neutral-300"
                )}>
                {isProgressive && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><Check className="w-3 h-3 text-slate-950" /></span>}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-extrabold text-neutral-900">Progressive (Presbyopia)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">+40</span>
                </div>
                <p className="text-xs text-neutral-500 font-normal leading-relaxed">No-line multifocal. Requires a near Addition (ADD) power. Typically prescribed for presbyopia age 40+.</p>
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/60">Distance + Intermediate + Near</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">Patient Age <span className="text-neutral-400 font-normal">(optional)</span></label>
                <input type="number" min="1" max="120" value={state.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 42"
                  className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold transition-all outline-none" />
              </div>
              {showAgeAdvisory && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 self-end">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium"><strong>Age {parsedAge}:</strong> Most patients 40+ benefit from Progressive lenses for presbyopia. Consider selecting Progressive above.</p>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Lens Package */}
          <div className="p-6 sm:p-8 border-b border-neutral-100 bg-neutral-50/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                  Step 2 — {isProgressive ? "Progressive Lens Package" : "Lens Package"}
                </h2>
                <p className="text-xs text-neutral-500 font-normal mt-0.5">
                  {isProgressive ? "4 progressive packages (Ultra-Thin 1.67 excluded — no progressive support)." : "5 standard single-vision lens packages."}
                </p>
              </div>
            </div>
            <div className={cn("grid gap-3", isProgressive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
              {activeLenses.slice(0, isProgressive ? 4 : 3).map((lens) => (
                <LensCard key={lens.id} lens={lens} selected={state.selectedLensId === lens.id} basePrices={basePrices} onClick={() => set("selectedLensId", lens.id)} />
              ))}
            </div>
            {!isProgressive && activeLenses.slice(3).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
                {activeLenses.slice(3).map((lens) => (
                  <LensCard key={lens.id} lens={lens} selected={state.selectedLensId === lens.id} basePrices={basePrices} onClick={() => set("selectedLensId", lens.id)} />
                ))}
              </div>
            )}
          </div>

          {/* STEP 3: Rx + Conditional ADD */}
          <div className="p-6 sm:p-8 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                  <Calculator className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                    Step 3 — {isProgressive ? "Refractive Powers & ADD (Progressive)" : "Enter Eye Prescription (OD & OS)"}
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal mt-0.5">
                    SPH, CYL, and AXIS for each eye.{isProgressive ? " ADD power required for progressive calculation." : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => set("noRxFallback", !state.noRxFallback)}
                className={cn("inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                  state.noRxFallback ? "bg-amber-500/10 border-amber-500/40 text-amber-700" : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}>
                <BookOpen className="w-3.5 h-3.5" />
                {state.noRxFallback ? "Using Estimated Defaults" : "Don't have Rx handy?"}
              </button>
            </div>

            {state.noRxFallback && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 font-medium">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span><strong>Estimated defaults active:</strong>{" "}
                  {isProgressive ? "Plano (0.00 SPH / 0.00 CYL) with standard entry ADD +1.50 D. Actual price may vary." : "Plano (0.00 SPH / 0.00 CYL) — base tier rate only. Enter actual Rx for exact price."}
                </span>
              </div>
            )}

            {isProgressive && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 font-medium">
                <strong>Pupillary Distance (PD):</strong> For custom progressive lenses, our optical team will contact you on WhatsApp after order placement to confirm your PD measurement.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4", state.noRxFallback && "opacity-50")}>
                <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-3">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Right Eye (OD)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PrescriptionInputGroup label="Sphere (SPH)" value={state.od.sph} onChange={(v) => setEye("od", "sph", v)} options={SPH_ALL} disabled={state.noRxFallback} />
                  <PrescriptionInputGroup label="Cylinder (CYL)" value={state.od.cyl} onChange={(v) => setEye("od", "cyl", v)} options={CYL_ALL} disabled={state.noRxFallback} />
                </div>
                <PrescriptionInputGroup label="Axis" value={state.od.axis} onChange={(v) => setEye("od", "axis", v)} options={AXIS_OPTIONS} isAxis disabled={state.noRxFallback} />
              </div>

              <div className={cn("p-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 space-y-4", state.noRxFallback && "opacity-50")}>
                <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-3">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Left Eye (OS)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PrescriptionInputGroup label="Sphere (SPH)" value={state.os.sph} onChange={(v) => setEye("os", "sph", v)} options={SPH_ALL} disabled={state.noRxFallback} />
                  <PrescriptionInputGroup label="Cylinder (CYL)" value={state.os.cyl} onChange={(v) => setEye("os", "cyl", v)} options={CYL_ALL} disabled={state.noRxFallback} />
                </div>
                <PrescriptionInputGroup label="Axis" value={state.os.axis} onChange={(v) => setEye("os", "axis", v)} options={AXIS_OPTIONS} isAxis disabled={state.noRxFallback} />
              </div>
            </div>

            {/* Conditional ADD Block */}
            {isProgressive && (
              <div className="mt-6 p-5 rounded-2xl border-2 border-amber-400/40 bg-amber-50/30 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Near Addition (ADD Power) — Progressive Only</span>
                  </div>
                  <button type="button" onClick={() => set("addLinked", !state.addLinked)}
                    className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer",
                      state.addLinked ? "bg-emerald-50 border-emerald-300/70 text-emerald-700" : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}>
                    {state.addLinked ? <><Link2 className="w-3.5 h-3.5" /> OD = OS (Linked)</> : <><Unlink className="w-3.5 h-3.5" /> Decoupled</>}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800/70 font-normal leading-relaxed">
                  Reading ADD power (+0.75 D to +3.50 D in +0.25 D steps). Bilateral ADD is typically equal for both eyes. Toggle <strong>Decoupled</strong> to set OD and OS ADD independently.
                </p>
                <div className={cn("grid gap-4", state.addLinked ? "grid-cols-1 max-w-xs" : "grid-cols-1 sm:grid-cols-2")}>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                      {state.addLinked ? "ADD Power (Both Eyes)" : "OD — ADD Power"}
                    </label>
                    <select value={state.noRxFallback ? "+1.50" : state.odAdd} onChange={(e) => setAdd("od", e.target.value)} disabled={state.noRxFallback}
                      className={cn("w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none", state.noRxFallback && "opacity-50")}>
                      {ADD_OPTIONS.map((o) => <option key={o} value={o}>{o} D</option>)}
                    </select>
                  </div>
                  {!state.addLinked && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">OS — ADD Power</label>
                      <select value={state.noRxFallback ? "+1.50" : state.osAdd} onChange={(e) => setAdd("os", e.target.value)} disabled={state.noRxFallback}
                        className={cn("w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none", state.noRxFallback && "opacity-50")}>
                        {ADD_OPTIONS.map((o) => <option key={o} value={o}>{o} D</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {!state.addLinked && (
                  <p className="text-[10px] text-amber-700 font-medium">Average ADD for pricing: <strong>+{effectiveAdd.toFixed(2)} D</strong></p>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: Live Result */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">Step 4 — Live Pricing Result</h2>
                <p className="text-xs text-neutral-500 font-normal mt-0.5">Computed in real-time by our canonical optical pricing matrix engine. Zero hardcoded overrides.</p>
              </div>
            </div>

            {!result ? (
              <div className="p-6 rounded-2xl bg-red-50/60 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">
                    {isProgressive ? "Prescription outside progressive matrix — Contact Support" : "Prescription outside standard matrix — Contact Support"}
                  </h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    The entered values fall outside our automated pricing range. Please contact MY EYES support for a custom laboratory quote.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl border border-amber-200/60 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {isProgressive ? "Progressive Lens Pair Estimate" : "Single Vision Lens Pair Estimate"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isProgressive ? "Progressive Matrix Verified" : "Single Vision Matrix Verified"}
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                    <div>
                      <span className="font-semibold text-neutral-700">{selectedPkg.name}</span>
                      <span className="text-xs text-neutral-400 ml-2 font-medium">({selectedPkg.coating})</span>
                    </div>
                    <span className="font-mono text-xs text-neutral-500 font-bold">
                      Base {result.basePriceKey} @ Rs.&nbsp;{result.basePriceValue.toLocaleString()}
                    </span>
                  </div>

                  {isProgressive ? (
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                      <div>
                        <span className="font-semibold text-neutral-700">Progressive Corridor Tier</span>
                        <span className="text-xs text-amber-700 ml-2 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          ADD +{effectiveAdd.toFixed(2)} D
                        </span>
                      </div>
                      <span className="font-mono text-xs text-neutral-500 font-bold">
                        &times;{result.multiplier.toFixed(2)} multiplier
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                      <span className="font-semibold text-neutral-700">Standard Distance / Reading Lens</span>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        No ADD Surcharge
                      </span>
                    </div>
                  )}

                  {result.isAsymmetricRx && (
                    <>
                      <div className="flex justify-between items-center py-1.5 text-xs">
                        <span className="font-medium text-neutral-600">Right Lens (OD) — asymmetric pair split</span>
                        <span className="font-mono font-bold text-neutral-800">{formatPrice(result.rightEyeLensPrice ?? 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 text-xs border-b border-neutral-100 border-dashed">
                        <span className="font-medium text-neutral-600">Left Lens (OS) — asymmetric pair split</span>
                        <span className="font-mono font-bold text-neutral-800">{formatPrice(result.leftEyeLensPrice ?? 0)}</span>
                      </div>
                    </>
                  )}
                  {!result.isAsymmetricRx && (
                    <p className="text-xs text-neutral-400 font-medium">Both lenses priced identically (symmetric Rx).</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-3 border-t border-neutral-200">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">Pair Total (Lens Only)</span>
                    <span className="text-4xl font-black text-amber-600 tracking-tight">{formatPrice(result.finalPrice)}</span>
                    <span className="text-xs text-neutral-400 block mt-1 font-normal">Frame cost is separate. This is lens fabrication only.</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200/70 px-3 py-1.5 rounded-xl inline-block">
                      {isProgressive ? "40% advance required for progressive COD orders" : "25% advance required for COD orders"}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={ctaHref}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] font-bold shadow-sm transition-all hover:shadow-md hover:scale-[1.01] text-sm">
                    Apply &amp; Shop Frames
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[10px] text-neutral-400 mt-2 font-normal">
                    {isProgressive
                      ? `Carries visionType=progressive&add=${effectiveAdd.toFixed(2)} to catalog`
                      : "Carries visionType=single_vision to catalog"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lens Thickness Simulator */}
        <div className="pt-4">
          <LensThicknessSimulator
            odSph={state.noRxFallback ? "+0.00" : state.od.sph}
            osSph={state.noRxFallback ? "+0.00" : state.os.sph}
            odCyl={state.noRxFallback ? "+0.00" : state.od.cyl}
            osCyl={state.noRxFallback ? "+0.00" : state.os.cyl}
            selectedPackageId={state.selectedLensId}
            onSelectPackage={(pkg) => set("selectedLensId", pkg.id)}
          />
        </div>

      </div>
    </div>
  );
}
