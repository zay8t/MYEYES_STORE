"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { SOLEX_LENS_OPTIONS, calculateSolexLensPrice, SolexLensOption } from "@/lib/solex-lens-pricing";

export default function PricingPage() {
  const [lensOptions, setLensOptions] = useState<SolexLensOption[]>(SOLEX_LENS_OPTIONS);

  useEffect(() => {
    async function loadLensOptions() {
      try {
        const res = await fetch("/api/admin/lens-prices");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLensOptions(data);
          }
        }
      } catch (error) {
        console.error("Failed to load lens options:", error);
      }
    }
    loadLensOptions();
  }, []);

  // Test Calculator State
  const [testLensId, setTestLensId] = useState("sv-156-bluecut");
  const [testSph, setTestSph] = useState("-2.00");
  const [testCyl, setTestCyl] = useState("-0.50");
  const [testAdd, setTestAdd] = useState("+1.50");

  const parsedSph = parseFloat(testSph) || 0;
  const parsedCyl = parseFloat(testCyl) || 0;
  const parsedAdd = parseFloat(testAdd) || 0;

  const testLensObj = useMemo(() => {
    return lensOptions.find((l) => l.id === testLensId) || lensOptions[0] || SOLEX_LENS_OPTIONS[0];
  }, [lensOptions, testLensId]);

  const testCalculatedPrice = useMemo(() => {
    return calculateSolexLensPrice(
      testLensId,
      parsedSph,
      parsedCyl,
      parsedAdd,
      testLensObj?.basePrice,
      parsedAdd > 0,
      testLensObj?.pricePlus40
    );
  }, [testLensId, parsedSph, parsedCyl, parsedAdd, testLensObj]);

  return (
    <div className="min-h-screen bg-white py-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto border-b border-slate-100 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-[11px] font-bold uppercase tracking-widest text-amber-800 border border-amber-200/60">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            Official MY EYES Precision Lens Catalog
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Prescription Lens Pricing Guide
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed">
            Transparent pricing direct from MY EYES Precision Labs. Featuring dual pricing matrices for Standard Vision and +40 Presbyopia lenses calculated precisely according to your SPH, CYL, and ADD specifications.
          </p>
        </div>

        {/* Interactive Price Test Calculator Widget */}
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                LIVE ESTIMATOR
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Test Prescription Price Calculator
              </h2>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
              MY EYES Lab Rate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Lens Package
              </label>
              <select
                value={testLensId}
                onChange={(e) => setTestLensId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-semibold"
              >
                {lensOptions.map((lens) => (
                  <option key={lens.id} value={lens.id}>
                    {lens.name} ({lens.index})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sphere (SPH)
              </label>
              <input
                type="number"
                step="0.25"
                value={testSph}
                onChange={(e) => setTestSph(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-semibold"
                placeholder="-2.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cylinder (CYL)
              </label>
              <input
                type="number"
                step="0.25"
                value={testCyl}
                onChange={(e) => setTestCyl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-semibold"
                placeholder="-0.50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Addition (ADD)
              </label>
              <input
                type="text"
                value={testAdd}
                onChange={(e) => setTestAdd(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-semibold"
                placeholder="+1.50"
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900">{testLensObj.name}</span>
              <p className="text-xs text-slate-500 mt-0.5">{testLensObj.description} · Coating: {testLensObj.coating}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-extrabold text-slate-900 block">
                Rs. {testCalculatedPrice}/-
              </span>
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                {parsedAdd > 0 ? "+40 Presbyopia Tier" : "Standard Tier"}
              </span>
            </div>
          </div>
        </div>

        {/* MY EYES Precision Lens Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">MY EYES Precision Lenses Catalog</h2>
            <Link
              href="/eyeglasses"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              Browse Frames
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lensOptions.map((lens) => (
              <div
                key={lens.id}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                        {lens.category.replace("_", " ")} · {lens.index} Index
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">
                        {lens.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        Std: Rs. {lens.basePrice}/-
                      </span>
                      <span className="text-xs font-bold text-amber-800 block">
                        +40: Rs. {lens.pricePlus40 || (lens.basePrice + 400)}/-
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {lens.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Coating: {lens.coating}</span>
                  <button
                    onClick={() => {
                      setTestLensId(lens.id);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="text-amber-700 hover:underline font-bold"
                  >
                    Test Price →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
