"use client";

import React, { useState, useMemo, useEffect, useOptimistic, startTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import ProductModal, { FRAME_SHAPES_OPTIONS, MATERIALS_OPTIONS, CATEGORIES_OPTIONS } from "./ProductModal";
import { deleteProductAction, updateProductStockAction } from "@/app/actions/admin";
import { Product } from "@prisma/client";
import Toast from "./Toast";

export interface ProductsCatalogClientProps {
  initialProducts: Product[];
}

export default function ProductsCatalogClient({ initialProducts }: ProductsCatalogClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMaterial, setSelectedMaterial] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Optimistic UI updates
  const [optimisticProducts, setOptimisticProducts] = useOptimistic(
    products,
    (state, action: { type: "DELETE" | "UPDATE_STOCK"; id: string; stock?: number }) => {
      if (action.type === "DELETE") {
        return state.filter((p) => p.id !== action.id);
      }
      if (action.type === "UPDATE_STOCK" && action.stock !== undefined) {
        return state.map((p) => (p.id === action.id ? { ...p, stock: action.stock! } : p));
      }
      return state;
    }
  );

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this frame from the catalog?")) return;

    // OPTIMISTIC UPDATE: 0ms visual removal
    startTransition(() => {
      setOptimisticProducts({ type: "DELETE", id: productId });
    });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setToast({ message: "Frame deleted from catalog", type: "info" });
    const result = await deleteProductAction(productId);
    if (!result.success) {
      setToast({ message: result.error || "Failed to delete product", type: "error" });
    }
  };

  const handleStockChange = async (productId: string, newStock: number) => {
    const val = Math.max(0, newStock);

    // OPTIMISTIC UPDATE: 0ms stock update
    startTransition(() => {
      setOptimisticProducts({ type: "UPDATE_STOCK", id: productId, stock: val });
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: val } : p))
    );
    setToast({ message: `Updated stock level to ${val} units`, type: "success" });
    await updateProductStockAction(productId, val);
  };

  const filteredProducts = useMemo(() => {
    return optimisticProducts.filter((product) => {
      if (selectedCategory !== "ALL" && product.category !== selectedCategory) return false;
      if (selectedMaterial !== "ALL" && product.material !== selectedMaterial) return false;
      if (debouncedQuery.trim() !== "") {
        const q = debouncedQuery.toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(q);
        const descMatch = product.description?.toLowerCase().includes(q);
        const shapeMatch = product.frameShape?.toLowerCase().includes(q);
        return nameMatch || descMatch || shapeMatch;
      }
      return true;
    });
  }, [optimisticProducts, selectedCategory, selectedMaterial, debouncedQuery]);

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

  const getMaterialLabel = (val: string) => {
    const found = MATERIALS_OPTIONS.find((m) => m.value === val);
    return found ? found.label : val;
  };

  const getShapeLabel = (val: string) => {
    const found = FRAME_SHAPES_OPTIONS.find((s) => s.value === val);
    return found ? found.label : val;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
            FRAME CATALOG MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Eyewear Products & Variants Suite
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Optimize frames, set material specifications, and manage high-resolution assets
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Eyewear Frame</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search frame name, description, shape..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES_OPTIONS.map((opt) => (
              <option key={"filter-" + opt.value + opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="ALL">All Materials</option>
            {MATERIALS_OPTIONS.map((opt) => (
              <option key={"filter-" + opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Dense Sortable Data Table (md and above) */}
      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Frame Image & Name</th>
              <th className="px-6 py-4">Category & Shape</th>
              <th className="px-6 py-4">Material / Gender</th>
              <th className="px-6 py-4">Price (PKR)</th>
              <th className="px-6 py-4">Inventory Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                  No frame products found matching search filter.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const imgUrl = getFirstImage(product.images);

                return (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          <Image
                            src={imgUrl}
                            alt={product.name}
                            fill
                            sizes="48px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{product.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Slug: {product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-900 font-bold text-[10px] uppercase block w-max mb-1">
                        {product.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Shape: {getShapeLabel(product.frameShape)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{getMaterialLabel(product.material)}</p>
                      <p className="text-[11px] text-slate-400">{product.gender}</p>
                    </td>

                    <td className="px-6 py-4 font-mono font-extrabold text-slate-900">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => handleStockChange(product.id, parseInt(e.target.value, 10) || 0)}
                          className={cn(
                            "w-16 px-2.5 py-1 text-xs font-mono font-extrabold rounded-lg border focus:outline-none",
                            product.stock < 5
                              ? "bg-rose-50 text-rose-900 border-rose-300"
                              : "bg-slate-50 text-slate-900 border-slate-200"
                          )}
                        />
                        <span className="text-[10px] text-slate-400 font-bold">Units</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Mobile/Tablet Touch Cards (< md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const imgUrl = getFirstImage(product.images);

          return (
            <div key={product.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  <Image
                    src={imgUrl}
                    alt={product.name}
                    fill
                    sizes="56px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-slate-900 text-xs">{product.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {product.category} · {getMaterialLabel(product.material)}
                  </p>
                  <p className="text-xs font-mono font-extrabold text-slate-900 mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">Stock:</span>
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => handleStockChange(product.id, parseInt(e.target.value, 10) || 0)}
                    className="w-14 px-2 py-1 text-xs font-mono font-bold rounded-lg border bg-slate-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-xl bg-rose-50 text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frame Create / Edit Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
            setToast({ message: "Product saved successfully", type: "success" });
          }}
        />
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
