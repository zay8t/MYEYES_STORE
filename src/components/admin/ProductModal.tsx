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

export const FORM_CATEGORY_OPTIONS = [
  { label: "None / Other (Nill)", value: "NILL" },
  { label: "Men's Eyeglasses", value: "MENS_EYEGLASSES" },
  { label: "Women's Eyeglasses", value: "WOMENS_EYEGLASSES" },
  { label: "Unisex Eyeglasses", value: "UNISEX_EYEGLASSES" },
  { label: "Kids' Eyeglasses", value: "KIDS_EYEGLASSES" },
  { label: "Men's Sunglasses", value: "MENS_SUNGLASSES" },
  { label: "Women's Sunglasses", value: "WOMENS_SUNGLASSES" },
  { label: "Unisex Sunglasses", value: "UNISEX_SUNGLASSES" },
  { label: "Kids' Sunglasses", value: "KIDS_SUNGLASSES" },
  { label: "Contact Lenses", value: "CONTACT_LENSES" },
  { label: "Accessories", value: "ACCESSORIES" },
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
  const [gender, setGender] = useState(product?.gender || "Unspecified");
  const [featured, setFeatured] = useState<boolean>(product?.featured ?? false);

  const getInitialFormCategory = (): string => {
    if (!product) return "MENS_EYEGLASSES";
    const cat = product.category;
    const gen = product.gender?.toLowerCase() || "";
    if (cat === "EYEGLASSES") {
      if (gen === "men") return "MENS_EYEGLASSES";
      if (gen === "women") return "WOMENS_EYEGLASSES";
      if (gen === "kids") return "KIDS_EYEGLASSES";
      return "MENS_EYEGLASSES";
    }
    if (cat === "SUNGLASSES") {
      if (gen === "men") return "MENS_SUNGLASSES";
      if (gen === "women") return "WOMENS_SUNGLASSES";
      if (gen === "kids") return "KIDS_SUNGLASSES";
      return "MENS_SUNGLASSES";
    }
    if (cat === "CONTACT_LENSES") return "CONTACT_LENSES";
    if (cat === "ACCESSORIES") return "ACCESSORIES";
    return "NILL";
  };

  const [formCategory, setFormCategory] = useState<string>(getInitialFormCategory());

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

    const inputData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock, 10) || 0,
      category,
      frameShape,
      material,
      gender,
      images,
      featured,
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Category / Subcategory *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormCategory(val);
                    if (val === "MENS_EYEGLASSES") {
                      setCategory("EYEGLASSES");
                      setGender("Men");
                    } else if (val === "WOMENS_EYEGLASSES") {
                      setCategory("EYEGLASSES");
                      setGender("Women");
                    } else if (val === "UNISEX_EYEGLASSES") {
                      setCategory("EYEGLASSES");
                      setGender("Unisex");
                    } else if (val === "KIDS_EYEGLASSES") {
                      setCategory("EYEGLASSES");
                      setGender("Kids");
                    } else if (val === "MENS_SUNGLASSES") {
                      setCategory("SUNGLASSES");
                      setGender("Men");
                    } else if (val === "WOMENS_SUNGLASSES") {
                      setCategory("SUNGLASSES");
                      setGender("Women");
                    } else if (val === "UNISEX_SUNGLASSES") {
                      setCategory("SUNGLASSES");
                      setGender("Unisex");
                    } else if (val === "KIDS_SUNGLASSES") {
                      setCategory("SUNGLASSES");
                      setGender("Kids");
                    } else if (val === "CONTACT_LENSES") {
                      setCategory("CONTACT_LENSES");
                      setGender("Unisex");
                    } else if (val === "ACCESSORIES") {
                      setCategory("ACCESSORIES");
                      setGender("Unisex");
                    } else {
                      setCategory("NILL");
                      setGender("NILL");
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {FORM_CATEGORY_OPTIONS.map((opt) => (
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

          {/* Zero-Lag Async Image Uploader */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Instant Zero-Lag Frame Image Manager *
            </label>
            <ImageUploader images={images} onChange={(newImgs) => setImages(newImgs)} />
          </div>

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
