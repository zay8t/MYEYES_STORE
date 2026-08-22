"use client";

import React, { useState } from "react";
import {
  X,
  Glasses,
  Save,
  Tag,
} from "lucide-react";
import { Category, FrameShape, Material, Product } from "@prisma/client";
import ImageUploader from "./ImageUploader";
import GLBAssetManager from "./GLBAssetManager";

export interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const FRAME_SHAPES_OPTIONS = [
  { label: "None / Other (Nill)", value: "NILL" },
  { label: "Wayfarer (Wafer)", value: "WAYFARER" },
  { label: "Aviator", value: "AVIATOR" },
  { label: "Rectangle", value: "RECTANGLE" },
  { label: "Round", value: "ROUND" },
  { label: "Oval", value: "OVAL" },
  { label: "Square", value: "SQUARE" },
  { label: "Cat-Eye", value: "CAT_EYE" },
  { label: "Geometric / Octagon", value: "GEOMETRIC" },
  { label: "Rimless", value: "RIMLESS" },
  { label: "Semi-Rimless / Clubmaster", value: "SEMI_RIMLESS" },
];

export const MATERIALS_OPTIONS = [
  { label: "None / Other (Nill)", value: "NILL" },
  { label: "Acetate", value: "ACETATE" },
  { label: "Metal", value: "METAL" },
  { label: "Titanium", value: "TITANIUM" },
  { label: "TR90 / Flexible Polymer", value: "TR90" },
  { label: "Stainless Steel", value: "STAINLESS_STEEL" },
  { label: "Wood Finish", value: "WOOD" },
  { label: "Hybrid / Combination", value: "HYBRID" },
];

export const GENDER_OPTIONS = [
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Unisex", value: "Unisex" },
  { label: "Kids", value: "Kids" },
];

export const ALL_COLORS = [
  { value: "black", label: "Solid Black & Midnight", hex: "#18181B" },
  { value: "tortoise", label: "Classic Tortoise & Havana", hex: "#6B3E11" },
  { value: "crystal", label: "Crystal Clear & Ice", hex: "#E2E8F0" },
  { value: "grey", label: "Smoked Slate & Grey", hex: "#64748B" },
  { value: "amber", label: "Warm Amber & Honey Brown", hex: "#D97706" },
  { value: "gold", label: "Classic Gold & Champagne", hex: "#EAB308" },
  { value: "silver", label: "Silver & Gunmetal Steel", hex: "#94A3B8" },
  { value: "rose_gold", label: "Rose Gold & Warm Copper", hex: "#FB7185" },
  { value: "red", label: "Crimson & Bold Red", hex: "#DC2626" },
  { value: "blue", label: "Electric Cobalt & Deep Navy", hex: "#2563EB" },
  { value: "teal", label: "Bright Cyan & Tropical Teal", hex: "#06B6D4" },
  { value: "green", label: "Emerald & Olive Green", hex: "#16A34A" },
  { value: "orange", label: "Vivid Orange & Sunburst", hex: "#EA580C" },
  { value: "pink", label: "Bubblegum & Pastel Pink", hex: "#EC4899" },
  { value: "purple", label: "Lilac & Royal Purple", hex: "#9333EA" }
];

export const CATEGORIES_OPTIONS = [
  { label: "None / Other (Nill)", value: "NILL" },
  { label: "Eyeglasses", value: "EYEGLASSES" },
  { label: "Sunglasses", value: "SUNGLASSES" },
  { label: "Contact Lenses", value: "CONTACT_LENSES" },
  { label: "Accessories", value: "ACCESSORIES" },
];

export default function ProductModal({
  product,
  onClose,
  onSuccess,
}: ProductModalProps) {
  const isEditing = Boolean(product);

  const parseExistingImages = (imgData?: string | null): string[] => {
    if (!imgData) return [];
    if (imgData.startsWith("[")) {
      try {
        return JSON.parse(imgData);
      } catch {
        return [];
      }
    }
    return imgData.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [stock, setStock] = useState(product?.stock ? String(product.stock) : "10");
  const [category, setCategory] = useState<Category>(product?.category || "EYEGLASSES");
  const [frameShape, setFrameShape] = useState<FrameShape>(product?.frameShape || "NILL");
  const [material, setMaterial] = useState<Material>(product?.material || "NILL");
  const [gender, setGender] = useState(product?.gender || "Unisex");
  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    if (!product) return [];
    const prod = product as Record<string, unknown>;
    const rawColors = prod.colors;
    if (Array.isArray(rawColors)) {
      return rawColors.map(c => String(c));
    }
    if (typeof rawColors === "string") {
      return rawColors.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });
  const [featured, setFeatured] = useState<boolean>(product?.featured ?? false);
  const [modelGlbUrl, setModelGlbUrl] = useState<string | null>(product?.modelGlbUrl || null);

  const [images, setImages] = useState<string[]>(parseExistingImages(product?.images));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !description.trim()) {
      setErrorMsg("Please fill in required fields (Name, Price, Description).");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("Please attach at least one product frame image.");
      return;
    }

    if (images.some((url) => url.startsWith("blob:"))) {
      setErrorMsg("Please wait for all image uploads to complete processing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    if (selectedColors.length === 0) {
      setErrorMsg("Please select at least one available color variant.");
      return;
    }

    const inputData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock, 10) || 0,
      category,
      frameShape,
      material,
      gender,
      colors: selectedColors,
      images,
      featured,
      modelGlbUrl,
    };

    try {
      let res;
      if (isEditing && product) {
        res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputData),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputData),
        });
      }

      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMsg(errorData.error || "Failed to save product.");
      }
    } catch (err: unknown) {
      console.error("Error submitting frame:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving the frame.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300/50 flex items-center justify-center font-extrabold shadow-2xs">
              <Glasses className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                {isEditing ? "Edit Eyewear Frame & Attributes" : "Add New Eyewear Frame"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing && product ? `Modifying frame ID #${product.id.slice(0, 8)}` : "Create new frame listing with instant store synchronization"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              {errorMsg}
            </div>
          )}

          {/* Basic Product Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Frame Model Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aviator Titanium Classic"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Price (PKR) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4999"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Inventory Stock Qty *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50 font-mono"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Frame Description & Features *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe frame design, durability, optical lens compatibility..."
              className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
              required
            />
          </div>

          {/* Optical Specifications & Category Variants */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-600" /> Frame Variants & Optical Specs
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {CATEGORIES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Target Audience / Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Frame Shape
                </label>
                <select
                  value={frameShape}
                  onChange={(e) => setFrameShape(e.target.value as FrameShape)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {FRAME_SHAPES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as Material)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {MATERIALS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Select Color Picker */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Available Frame Colors *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ALL_COLORS.map((c) => {
                  const isSelected = selectedColors.includes(c.value);
                  return (
                    <label
                      key={c.value}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none
                        ${isSelected
                          ? "border-amber-500 bg-amber-50/40 text-amber-950"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedColors((prev) =>
                            prev.includes(c.value)
                              ? prev.filter((v) => v !== c.value)
                              : [...prev, c.value]
                          );
                        }}
                        className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer shrink-0"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs block shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate">{c.label.split(" & ")[0]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                id="featuredToggle"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="featuredToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Feature on Homepage Showcase Carousel
              </label>
            </div>
          </div>

          {/* Zero-Lag Cloudinary Image Uploader */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Cloudinary Frame Image Manager *
            </label>
            <ImageUploader
              images={images}
              productId={product?.id}
              onChange={(newImgs) => setImages(newImgs)}
            />
          </div>

          {/* 3D CAD Model (.glb) Manager */}
          <GLBAssetManager
            productId={product?.id}
            initialGlbUrl={modelGlbUrl}
            onUrlUpdated={(url: string | null) => setModelGlbUrl(url)}
          />

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving Frame...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "Save Changes" : "Publish Frame Now"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
