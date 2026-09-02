"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tag, Calculator, Eye, AlertCircle, ArrowRight, ShieldCheck,
  Sparkles, Check, BookOpen, ChevronRight, Unlink, Link2, Info, RefreshCw,
} from "lucide-react";
import {
  calculateTotalLensPrice,
  calculateTotalProgressivePrice,
} from "@/lib/pricingEngine";
import { formatPrice, cn } from "@/lib/utils";
import LensThicknessSimulator from "@/components/pricing/LensThicknessSimulator";
import { useLensPricing, LensPricingTier } from "@/hooks/useLensPricing";
import Step1VisionType, { VisionType } from "@/components/pricing/Step1VisionType";
import Step2LensPackages from "@/components/pricing/Step2LensPackages";
import Step3Prescription, { EyeRx, SPH_ALL, CYL_ALL, AXIS_OPTIONS } from "@/components/pricing/Step3Prescription";

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

function parsePow(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black bg-amber-500 text-slate-950 border border-amber-500 shadow-xs">
        {step}
      </span>
      <span className="hidden sm:block">{label}</span>
    </div>
  );
}

export function LensPricingWizard() {
  const { packages, basePrices, refresh, isLoading } = useLensPricing();

  const [state, setState] = useState<WizardState>({
    visionType: "single_vision",
    age: "",
    selectedLensId: "sv-156-bluecut",
    od: { sph: "0.00", cyl: "0.00", axis: "90" },
    os: { sph: "0.00", cyl: "0.00", axis: "90" },
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
  const showAgeAdvisory = parsedAge >= 40 && !isProgressive;

  // Active package tiers filtered according to Single Vision vs Progressive modes
  const activePackages = useMemo(() => {
    if (isProgressive) {
      return packages.filter((p) => p.id !== "sv-167-shmc");
    }
    return packages;
  }, [packages, isProgressive]);

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

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === state.selectedLensId) ?? packages[1] ?? packages[0],
    [packages, state.selectedLensId]
  );

  // Step 4 live calculation: uses the fetched base price before prescription SPH/CYL/AXIS evaluations
  const result = useMemo(() => {
    if (isProgressive) {
      return calculateTotalProgressivePrice(
        state.selectedLensId,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        effectiveAdd,
        basePrices
      );
    }
    return calculateTotalLensPrice(
      state.selectedLensId,
      { sph: parsedOdSph, cyl: parsedOdCyl },
      { sph: parsedOsSph, cyl: parsedOsCyl },
      basePrices
    );
  }, [isProgressive, state.selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, effectiveAdd, basePrices]);

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
            Lens Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
            Calculate Your Lens Price
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mx-auto font-normal">
            Find out the exact price for your lenses in a few simple steps. Live baseline rates directly linked to our optical lab pricing.
          </p>
          {isProgressive && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>All-in-One (Near &amp; Far) Mode Active</span>
            </div>
          )}
        </div>

        {/* Step Navigator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-1">
          <StepBadge step={1} label="1. Glasses Type" />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={2} label="2. Lens Choice" />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={3} label="3. Eye Numbers" />
          <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <StepBadge step={4} label="4. Total Price" />
        </div>

        {/* Main Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden">

          {/* STEP 1: Glasses Type */}
          <Step1VisionType
            visionType={state.visionType}
            onChangeVisionType={(v) => set("visionType", v)}
            age={state.age}
            onChangeAge={(a) => set("age", a)}
          />

          {/* STEP 2: Choose Your Lens */}
          <Step2LensPackages
            packages={packages}
            selectedLensId={state.selectedLensId}
            onSelectLensId={(id) => set("selectedLensId", id)}
            isProgressive={isProgressive}
            onRefresh={refresh}
            isLoading={isLoading}
          />

          {/* STEP 3: Eye Numbers + Conditional ADD */}
          <Step3Prescription
            od={state.od}
            os={state.os}
            odAdd={state.odAdd}
            osAdd={state.osAdd}
            addLinked={state.addLinked}
            noRxFallback={state.noRxFallback}
            isProgressive={isProgressive}
            effectiveAdd={effectiveAdd}
            onSetEye={setEye}
            onSetAdd={setAdd}
            onToggleAddLinked={() => set("addLinked", !state.addLinked)}
            onToggleNoRxFallback={() => set("noRxFallback", !state.noRxFallback)}
          />

          {/* STEP 4: Total Price */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">Step 4 — Your Final Lens Price</h2>
                <p className="text-xs text-neutral-500 font-normal mt-0.5">Here is the exact cost for your pair of lenses based on live baseline rates.</p>
              </div>
            </div>

            {!result ? (
              <div className="p-6 rounded-2xl bg-red-50/60 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">
                    Special numbers needed — Contact Support
                  </h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    The numbers entered require custom laboratory crafting. Please message our team for quick help.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl border border-amber-200/60 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Estimated Lens Price
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Price Guaranteed
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                    <div>
                      <span className="font-semibold text-neutral-700">{selectedPkg.cleanName || selectedPkg.name}</span>
                      <span className="text-xs text-neutral-400 ml-2 font-medium">({selectedPkg.coating})</span>
                    </div>
                    <span className="text-xs text-neutral-500 font-bold bg-neutral-100 px-2 py-0.5 rounded-md">
                      Pair of Lenses
                    </span>
                  </div>

                  {isProgressive ? (
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                      <div>
                        <span className="font-semibold text-neutral-700">PROGRESSIVE (TWO IN 1 NEAR AND FAR)</span>
                        <span className="text-xs text-amber-700 ml-2 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          Reading +{effectiveAdd.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        Far + Near Included (Base Rs. {selectedPkg.presbyopiaBasePrice.toLocaleString()})
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
                      <span className="font-semibold text-neutral-700">STANDARD VISION LENS (EVERYDAY SINGLE WEAR)</span>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        Base Rs. {selectedPkg.standardBasePrice.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {result.isAsymmetricRx && (
                    <>
                      <div className="flex justify-between items-center py-1.5 text-xs">
                        <span className="font-medium text-neutral-600">Right Lens — customized power</span>
                        <span className="font-mono font-bold text-neutral-800">{formatPrice(result.rightEyeLensPrice ?? 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 text-xs border-b border-neutral-100 border-dashed">
                        <span className="font-medium text-neutral-600">Left Lens — customized power</span>
                        <span className="font-mono font-bold text-neutral-800">{formatPrice(result.leftEyeLensPrice ?? 0)}</span>
                      </div>
                    </>
                  )}
                  {!result.isAsymmetricRx && (
                    <p className="text-xs text-neutral-400 font-medium">Both left and right lenses included</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-3 border-t border-neutral-200">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">Total Lens Price</span>
                    <span className="text-4xl font-black text-amber-600 tracking-tight">{formatPrice(result.finalPrice)}</span>
                    <span className="text-xs text-neutral-400 block mt-1 font-normal">Pick a frame next to complete your order.</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200/70 px-3 py-1.5 rounded-xl inline-block">
                      {isProgressive ? "40% advance for Cash on Delivery" : "25% advance for Cash on Delivery"}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={ctaHref}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] font-bold shadow-sm transition-all hover:shadow-md hover:scale-[1.01] text-sm">
                    Choose Your Frame
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-[10px] text-neutral-400 mt-2 font-normal">
                    Saves your lens settings for your frame
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
            add={effectiveAdd}
            visionType={state.visionType}
            selectedPackageId={state.selectedLensId}
            finalCalculatedPrice={result?.finalPrice}
            onSelectPackage={(pkg) => set("selectedLensId", pkg.id)}
          />
        </div>

      </div>
    </div>
  );
}

export default LensPricingWizard;
