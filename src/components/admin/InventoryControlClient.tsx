"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Minus,
  Search,
  AlertTriangle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { adjustStockDeltaAction, updateProductStockAction } from "@/app/actions/admin";
import { Product } from "@prisma/client";

export interface InventoryControlClientProps {
  initialProducts: Product[];
}

export default function InventoryControlClient({ initialProducts }: InventoryControlClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAdjustDelta = async (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    await adjustStockDeltaAction(productId, delta);
  };

  const handleDirectInput = async (productId: string, valStr: string) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: val } : p))
    );
    await updateProductStockAction(productId, val);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (stockFilter === "LOW" && p.stock >= 5) return false;
      if (stockFilter === "OUT" && p.stock > 0) return false;
      if (stockFilter === "IN" && p.stock === 0) return false;
      if (debouncedQuery.trim() !== "") {
        const q = debouncedQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.frameShape.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, stockFilter, debouncedQuery]);

  const lowStockCount = products.filter((p) => p.stock < 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalUnitsCount = products.reduce((sum, p) => sum + p.stock, 0);

  const getFirstImage = (imgData: string): string => {
    if (!imgData) return "/logo.png";

    const isExternal = (url: string) =>
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.includes("unsplash") ||
      url.includes("pexels");

    if (imgData.startsWith("[")) {
      try {
        const parsed = JSON.parse(imgData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = String(parsed[0]).trim();
          return isExternal(first) ? "/logo.png" : first;
        }
      } catch {
        return "/logo.png";
      }
    }
    const split = imgData.split(",").map((s) => s.trim()).filter(Boolean);
    if (split.length > 0) {
      return isExternal(split[0]) ? "/logo.png" : split[0];
    }
    return "/logo.png";
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
            REAL-TIME INVENTORY CONTROL
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Frame Stock & Inventory Suite
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quick +/- stock adjustments with instant store-wide revalidation
          </p>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Total In-Stock Units
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalUnitsCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Warning (&lt; 5)
          </span>
          <p className="text-2xl font-black text-amber-950 font-mono">{lowStockCount} Frames</p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Out of Stock (0)
          </span>
          <p className="text-2xl font-black text-rose-950 font-mono">{outOfStockCount} Frames</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search frame name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="ALL">All Inventory Statuses</option>
            <option value="LOW">Low Stock (&lt; 5)</option>
            <option value="OUT">Out of Stock (0)</option>
            <option value="IN">In Stock (&gt; 0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table (Desktop/Laptop >= lg) */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Frame Model</th>
                <th className="px-6 py-4">Category / Material</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Instant Stock Adjuster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    No frames match inventory search filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const imgUrl = getFirstImage(p.images);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            <Image src={imgUrl} alt={p.name} fill sizes="40px" unoptimized className="object-cover" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: #{p.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{p.category}</p>
                        <p className="text-[11px] text-slate-400">{p.material}</p>
                      </td>

                      <td className="px-6 py-4 font-mono font-extrabold text-slate-900">
                        {formatPrice(p.price)}
                      </td>

                      <td className="px-6 py-4">
                        {p.stock === 0 ? (
                          <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 font-extrabold text-[10px] uppercase">
                            Out of Stock
                          </span>
                        ) : p.stock < 5 ? (
                          <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                            Low Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-[10px] uppercase">
                            In Stock ({p.stock})
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAdjustDelta(p.id, -1)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title="Decrease Stock (-1)"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            value={p.stock}
                            onChange={(e) => handleDirectInput(p.id, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-extrabold text-xs rounded-xl border border-slate-300 bg-white"
                          />

                          <button
                            onClick={() => handleAdjustDelta(p.id, 1)}
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
                            title="Increase Stock (+1)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View (< lg) */}
      <div className="lg:hidden space-y-3.5">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
            No frames match inventory search filter.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const imgUrl = getFirstImage(p.images);

            return (
              <div key={p.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      <Image src={imgUrl} alt={p.name} fill sizes="48px" unoptimized className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{p.category} · <span className="font-medium text-slate-500">{p.material}</span></p>
                      <span className="font-mono font-black text-slate-900 text-xs mt-1 block">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {p.stock === 0 ? (
                      <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 font-extrabold text-[10px] uppercase block text-center">
                        Out of Stock
                      </span>
                    ) : p.stock < 5 ? (
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[10px] uppercase block text-center">
                        Low Stock ({p.stock})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-[10px] uppercase block text-center">
                        In Stock ({p.stock})
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Quick Adjust:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustDelta(p.id, -1)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Decrease Stock (-1)"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      value={p.stock}
                      onChange={(e) => handleDirectInput(p.id, e.target.value)}
                      className="w-16 px-2 py-1.5 text-center font-mono font-extrabold text-xs rounded-xl border border-slate-300 bg-white"
                    />

                    <button
                      onClick={() => handleAdjustDelta(p.id, 1)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Increase Stock (+1)"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
