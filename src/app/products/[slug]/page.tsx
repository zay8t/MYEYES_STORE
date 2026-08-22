"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Glasses, Sun, ArrowLeft, Check, ShieldCheck, Truck, RotateCcw, Sparkles, X, Camera } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";
import ProductGallery from "@/components/product/ProductGallery";
import LogoLoader from "@/components/ui/LogoLoader";
import LensThicknessSimulator from "@/components/pricing/LensThicknessSimulator";
import dynamic from "next/dynamic";

const ARTryOnModal = dynamic(() => import("@/components/ARTryOn/ARTryOnModal"), {
  ssr: false,
  loading: () => null,
});

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
  const [thicknessModalOpen, setThicknessModalOpen] = useState(false);
  const [lensOption, setLensOption] = useState<"standard" | "polarized">("standard");
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
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
      image: currentImage,
      prescription: details,
    });
    setRxModalOpen(false);
  };

  const handleFrameOnlyAdd = () => {
    addItem({
      productId: product.id,
      name: `${product.name} (Frame Only)`,
      price: product.price,
      image: currentImage,
    });
  };

  const handleSunglassesAdd = () => {
    const isPolarized = lensOption === "polarized";
    const extraPrice = isPolarized ? 1200 : 0;
    addItem({
      productId: product.id,
      name: `${product.name} (${isPolarized ? "Polarized Sun Lenses" : "Standard Sun Lenses"})`,
      price: product.price + extraPrice,
      image: currentImage,
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 sm:py-14">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={product.category === "SUNGLASSES" ? "/sunglasses" : "/eyeglasses"}
            className="hover:text-slate-900 transition-colors"
          >
            {product.category === "SUNGLASSES" ? "Sunglasses" : "Eyeglasses"}
          </Link>
          <span>/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* LEFT: Multi-Angle Product Gallery (7 cols) */}
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
                Frame Specification &amp; Sizing Specs
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

            {/* Lens Thickness & Specs Trigger */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setThicknessModalOpen(true)}
                className="group inline-flex items-center gap-2 text-xs font-semibold text-[#ff7a00] hover:text-amber-700 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compare Lens Thickness &amp; Index Specs &rarr;</span>
              </button>
            </div>

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
                    Configure Lenses &amp; Add to Cart
                  </button>

                  <button
                    onClick={handleFrameOnlyAdd}
                    className="w-full py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Add Frame Only ({formatPrice(product.price)})
                  </button>
                </>
              )}

              {/* Virtual 3D Try-On */}
              <button
                type="button"
                id="product-tryon-btn"
                onClick={() => setIsTryOnOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-[#ff7a00] bg-amber-50/60 text-[#ff7a00] hover:bg-amber-100 font-semibold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Virtual 3D Try-On
              </button>
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

      {/* Lens Thickness & Refractive Index Slide-Over / Modal */}
      {thicknessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7a00]">
                  OPTICAL LAB SIMULATION
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Lens Thickness &amp; Index Specs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setThicknessModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <LensThicknessSimulator
                isModal={true}
                onSelectPackage={() => {
                  setThicknessModalOpen(false);
                  setRxModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Virtual 3D Try-On Modal */}
      <ARTryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        initialImageUrl={currentImage}
        initialProductId={product.id}
      />
    </div>
  );
}
