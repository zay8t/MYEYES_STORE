"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Glasses, Sun, ArrowLeft, Check, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";
import ProductGallery from "@/components/product/ProductGallery";
import LogoLoader from "@/components/ui/LogoLoader";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  frameShape: string;
  material: string;
  gender: string;
  images: string;
  category: string;
  featured: boolean;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Prescription modal state
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [lensOption, setLensOption] = useState<"standard" | "polarized">("standard");

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) {
          const found = data.find((p) => p.slug === resolvedParams.slug);
          setProduct(found || null);
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.slug]);

  if (loading) {
    return <LogoLoader size="fullscreen" text="LOADING FRAME DETAILS..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white py-20 max-w-7xl mx-auto px-4 text-center">
        <Glasses className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Frame Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">The frame model you requested does not exist or has been unlisted.</p>
        <Link
          href="/eyeglasses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Eyeglasses
        </Link>
      </div>
    );
  }

  const parseImages = (imagesStr: string): string[] => {
    if (!imagesStr) return ["/placeholder-frame.png"];
    try {
      let parsed: string[] = [];
      if (imagesStr.startsWith("[")) {
        parsed = JSON.parse(imagesStr);
      } else {
        parsed = imagesStr.split(",").map((s) => s.trim()).filter(Boolean);
      }
      const sanitized = parsed.map((img) => (img === "/logo.png" || !img ? "/placeholder-frame.png" : img));
      return sanitized.length > 0 ? sanitized : ["/placeholder-frame.png"];
    } catch {
      const fallbackVal = imagesStr === "/logo.png" || !imagesStr ? "/placeholder-frame.png" : imagesStr;
      return [fallbackVal];
    }
  };

  const imagesList = parseImages(product.images);
  const currentImage = imagesList[0] || "";

  const handleRxSubmit = (details: PrescriptionDetails, totalPrice: number) => {
    addItem({
      productId: product.id,
      name: `${product.name} (${details.lensUsage})`,
      price: totalPrice,
      image: currentImage || "",
      prescription: details,
    });
  };

  const handleFrameOnlyAdd = () => {
    addItem({
      productId: product.id,
      name: `${product.name} (Frame Only)`,
      price: product.price,
      image: currentImage || "",
    });
  };

  const handleSunglassesAdd = () => {
    if (!product) return;
    const imagesList = parseImages(product.images);
    const hasPolarized = lensOption === "polarized";
    const selectedPrice = product.price + (hasPolarized ? 1200 : 0);
    addItem({
      productId: product.id,
      name: `${product.name} (${hasPolarized ? "Polarized Lenses" : "Standard Sun Lenses"})`,
      price: selectedPrice,
      image: imagesList[0] || "",
    });
  };

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href={product.category === "SUNGLASSES" ? "/sunglasses" : "/eyeglasses"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {product.category === "SUNGLASSES" ? "Sunglasses" : "Eyeglasses"} Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT: Multi-Angle Swipeable Frame Gallery (7 cols) */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={imagesList}
              productName={product.name}
              category={product.category}
            />
          </div>

          {/* RIGHT: Product Information & Spec Sheet (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {product.gender} · {product.material.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatPrice(product.price)}
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              {product.description}
            </p>

            {/* Frame Dimension Specs Diagram */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                Frame Specification & Sizing Specs
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Lens Width</span>
                  <span className="text-xs font-extrabold text-slate-900">51 mm</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Bridge</span>
                  <span className="text-xs font-extrabold text-slate-900">19 mm</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Temple</span>
                  <span className="text-xs font-extrabold text-slate-900">145 mm</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 text-center font-medium">
                Standard Fit: 51-19-145mm · Frame Shape: {product.frameShape.replace("_", " ")}
              </p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2 text-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">
                In Stock ({product.stock} units ready for optical fitting)
              </span>
            </div>

            {/* Sunglasses Lens Selection Options */}
            {product.category === "SUNGLASSES" && (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  Select Sun Lens Option
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLensOption("standard")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px]",
                      lensOption === "standard"
                        ? "border-slate-900 bg-white ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    )}
                  >
                    <div>
                      <span className="block text-[11px] font-bold text-slate-900">Standard Sun</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 leading-tight">
                        100% UV400 protected
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-900 mt-2">Included</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLensOption("polarized")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px]",
                      lensOption === "polarized"
                        ? "border-slate-900 bg-white ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    )}
                  >
                    <div>
                      <span className="block text-[11px] font-bold text-slate-900">Polarized Sun</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 leading-tight">
                        Glare reduction filter
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-900 mt-2">+Rs. 1,200/-</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {product.category === "SUNGLASSES" ? (
                <button
                  onClick={handleSunglassesAdd}
                  className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sun className="w-4 h-4" />
                  Add to Bag ({formatPrice(product.price + (lensOption === "polarized" ? 1200 : 0))})
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setRxModalOpen(true)}
                    className="w-full py-4 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Glasses className="w-4 h-4" />
                    Configure Lenses & Add to Cart
                  </button>

                  <button
                    onClick={handleFrameOnlyAdd}
                    className="w-full py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Add Frame Only ({formatPrice(product.price)})
                  </button>
                </>
              )}
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-500 font-medium">
              <div className="space-y-1">
                <Truck className="w-4 h-4 text-slate-700 mx-auto" />
                <span>Free Express Shipping</span>
              </div>
              <div className="space-y-1">
                <ShieldCheck className="w-4 h-4 text-slate-700 mx-auto" />
                <span>1-Year Lens Warranty</span>
              </div>
              <div className="space-y-1">
                <RotateCcw className="w-4 h-4 text-slate-700 mx-auto" />
                <span>30-Day Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {product.category !== "SUNGLASSES" && (
        <PrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => setRxModalOpen(false)}
          productName={product.name}
          productPrice={product.price}
          onSubmit={handleRxSubmit}
        />
      )}
    </div>
  );
}
