"use client";

import React, { useState } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { BasePriceConfig } from "@/lib/pricingEngine";

export default function BasePricesClient({ initialPrices }: { initialPrices: BasePriceConfig }) {
  const [prices, setPrices] = useState<BasePriceConfig>(initialPrices);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });

  const LENS_MAPPING = {
    B1: "MY EYES CR Hard Crystal Coat",
    B2: "MY EYES Blue Light Filter + UV Protection HMC",
    B3: "MY EYES Sun Adaptive Photochromic HMC",
    B4: "MY EYES Dual Shield - Blue Light & Photochromic HMC",
    B5: "MY EYES Ultra Thin Index",
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const res = await fetch("/api/admin/base-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      
      setStatus({ type: "success", message: "Base prices updated successfully!" });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch {
      setStatus({ type: "error", message: "Error updating base prices." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 space-y-8">
        
        {status.type && (
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {status.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {(["B1", "B2", "B3", "B4", "B5"] as const).map((key) => (
            <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
                    {key}
                  </span>
                  <h3 className="font-semibold text-slate-800">{LENS_MAPPING[key]}</h3>
                </div>
                <p className="text-slate-500 text-sm ml-10">
                  Base rate applied for exact absolute magnitude calculation.
                </p>
              </div>
              <div className="relative ml-10 md:ml-0 md:w-48">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rs.</span>
                <input
                  type="number"
                  value={prices[key]}
                  onChange={(e) => setPrices({ ...prices, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none font-semibold text-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-900 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Price Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
