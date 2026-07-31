"use client";

import React, { useState } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2, Eye, Glasses } from "lucide-react";

interface PresbyopiaPrices {
  P1: number;
  P2: number;
  P3: number;
  P4: number;
  P1_tier2: number;
  P2_tier2: number;
  P3_tier2: number;
  P4_tier2: number;
}

export default function PresbyopiaPricesClient({ initialPrices }: { initialPrices: PresbyopiaPrices }) {
  const [prices, setPrices] = useState<PresbyopiaPrices>(initialPrices);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });

  const LENS_MAPPING = {
    P1: "Progressive Free Form 1.56 HMC",
    P2: "MY EYES Blue Light Filter + UV Protection HMC",
    P3: "MY EYES Sun Adaptive Photochromic HMC",
    P4: "MY EYES Dual Shield - Blue Light & Photochromic HMC",
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const res = await fetch("/api/admin/presbyopia-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      
      setStatus({ type: "success", message: "Presbyopia prices updated successfully!" });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch {
      setStatus({ type: "error", message: "Error updating presbyopia prices." });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (key: keyof PresbyopiaPrices, value: string) => {
    setPrices(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="space-y-8">
      {status.type && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.message}
        </div>
      )}

      {/* TIER 1 BASE RATES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Glasses className="w-5 h-5 text-amber-500" />
              Presbyopia Base Rates (Tier 1)
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Standard progressive base rates applied when SPH is between 0.00 and 3.00, CYL is 0, and ADD is between 1.00 and 3.00.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["P1", "P2", "P3", "P4"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
                    {key}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tier 1 Base</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-xs mt-1 min-h-[32px]">{LENS_MAPPING[key]}</h3>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">Rs.</span>
                  <input
                    type="number"
                    value={prices[key]}
                    onChange={(e) => handlePriceChange(key, e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none font-semibold text-slate-700 text-xs"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIER 2 HIGH-POWER RATES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              High-Power Base Rates (Tier 2)
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Base rates used to compute high-power progressive ranges. These values are scaled by multiplier tiers (e.g., 1.25x, 1.75x, 2.25x).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["P1_tier2", "P2_tier2", "P3_tier2", "P4_tier2"] as const).map((key) => {
              const baseKey = key.split("_")[0] as keyof typeof LENS_MAPPING;
              return (
                <div key={key} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
                      {key.replace("_tier2", "T2")}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tier 2 Base</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xs mt-1 min-h-[32px]">{LENS_MAPPING[baseKey]}</h3>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">Rs.</span>
                    <input
                      type="number"
                      value={prices[key]}
                      onChange={(e) => handlePriceChange(key, e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none font-semibold text-slate-700 text-xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SAVE ACTIONS BAR */}
      <div className="flex justify-end p-4 bg-slate-100 border border-slate-200 rounded-2xl">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Presbyopia Rates
        </button>
      </div>
    </div>
  );
}
