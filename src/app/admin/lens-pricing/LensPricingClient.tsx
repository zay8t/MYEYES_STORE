"use client";

import React, { useState } from "react";
import { Tag, Check, Pencil, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CORE_FIVE_LENS_IDS } from "@/lib/solex-lens-pricing";

interface LensOption {
  id: string;
  name: string;
  price: number;
  pricePlus40: number;
  type: string;
  index: string | null;
  description: string;
  isConfiguratorVisible: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  progressive: "Progressive Free Form Lenses",
  single_vision: "Single Vision Lenses",
  bifocal: "Bifocal Lenses (Lab Rates)",
};

const CORE_FIVE_SET = new Set<string>(CORE_FIVE_LENS_IDS);

export default function LensPricingClient({ initialOptions }: { initialOptions: LensOption[] }) {
  const [options, setOptions] = useState<LensOption[]>(initialOptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPricePlus40, setEditPricePlus40] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleEdit = (lens: LensOption) => {
    setEditingId(lens.id);
    setEditPrice(String(lens.price));
    setEditPricePlus40(String(lens.pricePlus40 || (lens.price + 400)));
    setError("");
  };

  const handleSave = async (id: string) => {
    const price = parseFloat(editPrice);
    const pricePlus40 = parseFloat(editPricePlus40);
    if (isNaN(price) || price < 0 || isNaN(pricePlus40) || pricePlus40 < 0) {
      setError("Enter valid standard and +40 prices");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/lens-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, basePrice: price, pricePlus40 }),
      });
      if (!res.ok) throw new Error("Save failed");
      setOptions(prev => prev.map(l => l.id === id ? { ...l, price, pricePlus40 } : l));
      setEditingId(null);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const groups = ["progressive", "single_vision", "bifocal"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <Tag className="w-4 h-4 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MY EYES Precision Lenses — Pricing Master</h1>
          </div>
          <p className="text-sm text-slate-500">Update Standard and +40 Presbyopia prices here — changes reflect immediately in the customer configurator & catalog.</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-emerald-500" /> Visible in Customer Configurator (5 Core Options)</span>
        <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-slate-400" /> Lab Rate Only (Hidden from Configurator)</span>
      </div>

      {/* Grouped Tables */}
      {groups.map(group => {
        const groupLenses = options.filter(l => l.type === group);
        if (!groupLenses.length) return null;
        return (
          <div key={group} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">{CATEGORY_LABELS[group] || group}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{groupLenses.length} lenses</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">MY EYES Lens Option</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Index</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Visibility</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider">Standard Price (No ADD)</th>
                    <th className="px-4 py-3 text-left font-bold text-amber-700 uppercase tracking-wider">+40 / Presbyopia Price (With ADD)</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupLenses.map(lens => {
                    const isEditing = editingId === lens.id;
                    const isSaved = savedId === lens.id;
                    const isCoreOption = CORE_FIVE_SET.has(lens.id);
                    return (
                      <tr key={lens.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{lens.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{lens.description}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">{lens.index || "—"}</td>
                        <td className="px-4 py-3.5">
                          {isCoreOption ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5">
                              <Eye className="w-3 h-3" /> Core Configurator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                              <EyeOff className="w-3 h-3" /> Lab Rate Only
                            </span>
                          )}
                        </td>

                        {/* Standard Price Column */}
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-semibold text-[11px]">Rs.</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={editPrice}
                                onChange={e => setEditPrice(e.target.value)}
                                className="w-20 px-2 py-1 rounded-lg border border-amber-400 text-slate-900 font-bold focus:ring-2 focus:ring-amber-400/50 focus:outline-none text-xs"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className={cn("font-bold text-slate-900", isSaved && "text-emerald-700")}>
                              Rs. {(lens.price || 0).toLocaleString()}/-
                            </span>
                          )}
                        </td>

                        {/* +40 Presbyopia Price Column */}
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-amber-700 font-semibold text-[11px]">Rs.</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={editPricePlus40}
                                onChange={e => setEditPricePlus40(e.target.value)}
                                className="w-20 px-2 py-1 rounded-lg border border-amber-500 text-amber-900 font-bold focus:ring-2 focus:ring-amber-400/50 focus:outline-none text-xs bg-amber-50/50"
                              />
                            </div>
                          ) : (
                            <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                              Rs. {(lens.pricePlus40 || (lens.price + 400)).toLocaleString()}/-
                            </span>
                          )}
                          {isEditing && error && (
                            <p className="text-[10px] text-red-600 mt-1">{error}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSave(lens.id)}
                                disabled={saving}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(lens)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" /> Edit Prices
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-800">
        <strong>💡 Note:</strong> Updates to <strong>Standard Price</strong> or <strong>+40 / Presbyopia Price</strong> update the database in real-time and reflect instantly on storefront pricing tables and the customer configurator.
      </div>
    </div>
  );
}
