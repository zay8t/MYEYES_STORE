"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  Loader2,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Glasses,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice, formatFrameShape, formatMaterial } from "@/lib/utils";

interface GeminiFrameStylistProps {
  products: SafeProduct[];
  onSelectProduct: (product: SafeProduct) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

type StepType = "FACE" | "FINISH" | "PRESCRIPTION" | "LIFESTYLE" | "BUDGET" | "LOADING" | "RESULTS";

interface RecommendationItem {
  product: SafeProduct;
  reason: string;
  opticalFit?: string;
}

export default function GeminiFrameStylist({
  products,
  onSelectProduct,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  isModal = false,
}: GeminiFrameStylistProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine active open state
  const isWidgetOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [step, setStep] = useState<StepType>("FACE");

  // Selection states
  const [faceShape, setFaceShape] = useState("Oval");
  const [metalPreference, setMetalPreference] = useState("Classic Matte Black");
  const [prescriptionType, setPrescriptionType] = useState("Single Vision Everyday");
  const [lifestyle, setLifestyle] = useState("Heavy Screen Time (8+ hrs)");
  const [budget, setBudget] = useState(5000);

  const [recommendedItems, setRecommendedItems] = useState<RecommendationItem[]>([]);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Calibrating facial geometry and proportional balance...",
    "Harmonizing skin tone and metal finish profile...",
    "Evaluating lens prescription thickness & frame pocket depth...",
    "Master optician curating bespoke frame recommendations...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "LOADING") {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleFetchRecommendations = async (selectedBudget: number) => {
    setStep("LOADING");
    try {
      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceShape,
          metalPreference,
          prescriptionType,
          lifestyle,
          budget: selectedBudget,
          products,
        }),
      });

      const data = await res.json();

      if (data.recommendations && data.recommendations.length > 0) {
        const mapped: RecommendationItem[] = data.recommendations
          .map((rec: { id: string; reason: string; opticalFit?: string }) => {
            const prod = products.find((p) => p.id === rec.id);
            if (!prod) return null;
            return {
              product: prod,
              reason: rec.reason,
              opticalFit: rec.opticalFit,
            };
          })
          .filter(Boolean) as RecommendationItem[];

        if (mapped.length > 0) {
          setRecommendedItems(mapped);
          setStep("RESULTS");
          return;
        }
      }

      // Fallback
      fallbackToSampleProducts();
    } catch (err) {
      console.error("Stylist fetch error:", err);
      fallbackToSampleProducts();
    }
  };

  const fallbackToSampleProducts = () => {
    const fallback = products.slice(0, 3).map((p, idx) => ({
      product: p,
      reason:
        idx === 0
          ? `Engineered to complement ${faceShape} face geometry with harmonious proportions and refined ${metalPreference.toLowerCase()} accents.`
          : idx === 1
          ? `Exceptional lightweight balance for ${lifestyle.toLowerCase()} with precision optical alignment for ${prescriptionType.toLowerCase()}.`
          : `Distinguished silhouette providing structural comfort and timeless styling for every occasion.`,
      opticalFit: `Ideal geometry for ${faceShape} profiles`,
    }));
    setRecommendedItems(fallback);
    setStep("RESULTS");
  };

  const handleReset = () => {
    setStep("FACE");
    setFaceShape("Oval");
    setMetalPreference("Classic Matte Black");
    setPrescriptionType("Single Vision Everyday");
    setLifestyle("Heavy Screen Time (8+ hrs)");
    setBudget(5000);
    setRecommendedItems([]);
  };

  const getProductImage = (product: SafeProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === "string" && product.images) {
      return product.images;
    }
    return "/placeholder-frame.png";
  };

  const stepNumbers = {
    FACE: 1,
    FINISH: 2,
    PRESCRIPTION: 3,
    LIFESTYLE: 4,
    BUDGET: 5,
    LOADING: 5,
    RESULTS: 5,
  };

  // The main consultative interface
  const consultativeWidgetContent = (
    <div className="bg-white w-full max-w-2xl h-[620px] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-900">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B132B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30 text-amber-400 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wider uppercase text-white">MY EYES Studio</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Virtual Stylist
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Bespoke Optical Fitting & Frame Consultation</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          aria-label="Close Stylist"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar & Step Tracker */}
      {step !== "RESULTS" && step !== "LOADING" && (
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-[10px] font-bold flex items-center justify-center">
              {stepNumbers[step]}
            </span>
            <span className="text-slate-800">
              {step === "FACE" && "Step 1: Facial Geometry"}
              {step === "FINISH" && "Step 2: Finish & Skin Tone"}
              {step === "PRESCRIPTION" && "Step 3: Lens & Prescription"}
              {step === "LIFESTYLE" && "Step 4: Lifestyle & Habits"}
              {step === "BUDGET" && "Step 5: Budget Range"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= stepNumbers[step] ? "w-6 bg-amber-500" : "w-2.5 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Consultation Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50">
        {/* ============================================================ */}
        {/* STEP 1: FACIAL GEOMETRY                                       */}
        {/* ============================================================ */}
        {step === "FACE" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">
                Facial Architecture
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                What is the general shape of your face?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Our optical algorithms use facial geometry to ensure proportional frame balance and flattering angles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { shape: "Oval", desc: "Balanced symmetry & gentle cheekbone curves" },
                { shape: "Round", desc: "Soft contours with equal width & height" },
                { shape: "Square", desc: "Defined angular jawline & broad forehead" },
                { shape: "Heart", desc: "Wider forehead tapering to an elegant chin" },
                { shape: "Diamond", desc: "Dramatic cheekbones & narrow hairline" },
                { shape: "Oblong", desc: "Elongated profile with straight cheek line" },
              ].map(({ shape, desc }) => (
                <button
                  key={shape}
                  onClick={() => {
                    setFaceShape(shape);
                    setStep("FINISH");
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {shape} Face
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: FINISH & TONE PREFERENCE                             */}
        {/* ============================================================ */}
        {step === "FINISH" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">
                Color & Material Harmonies
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Which metal finish or tone suits your aesthetic?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                We synchronize your frame finish with your personal skin tone and jewelry preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  label: "Classic Matte Black & Dark Acetate",
                  desc: "Timeless, versatile, high-contrast framing for all occasions",
                  colorCode: "bg-slate-900",
                },
                {
                  label: "Warm Gold & Champagne Accents",
                  desc: "Radiant warmth that elevates warm skin tones and fine jewelry",
                  colorCode: "bg-amber-400",
                },
                {
                  label: "Cool Silver & Chrome Minimalist",
                  desc: "Crisp, clean, contemporary luster with ultra-modern appeal",
                  colorCode: "bg-slate-300",
                },
                {
                  label: "Tortoise Shell & Rich Amber",
                  desc: "Distinctive organic warmth, vintage texture, and artisanal depth",
                  colorCode: "bg-amber-800",
                },
                {
                  label: "Gunmetal & Sleek Titanium",
                  desc: "Industrial luxury, featherlight durability, and subtle elegance",
                  colorCode: "bg-slate-600",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMetalPreference(item.label);
                    setStep("PRESCRIPTION");
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${item.colorCode} border border-slate-200 shadow-2xs shrink-0`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep("FACE")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← Back to Face Shape
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: LENS & PRESCRIPTION NEEDS                            */}
        {/* ============================================================ */}
        {step === "PRESCRIPTION" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">
                Optical Prescription Profile
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                What is your primary lens or vision requirement?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Certain frames accommodate high-index or progressive corridors more ergonomically.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  label: "Single Vision (Standard Distance or Reading)",
                  desc: "Standard correction for clear daily distance or close-up vision",
                  icon: Eye,
                },
                {
                  label: "High-Index Thin Lenses (Stronger Powers)",
                  desc: "Requires deep bevel acetate or sturdy rims to conceal edge thickness",
                  icon: ShieldCheck,
                },
                {
                  label: "Blue Light Screen Guard (Zero Power / Plano)",
                  desc: "Specialized anti-fatigue filtering for extensive monitor work",
                  icon: Glasses,
                },
                {
                  label: "Progressive / Bifocal Lenses",
                  desc: "Demands optimal frame lens height (B-measurement) for seamless corridors",
                  icon: SlidersHorizontal,
                },
                {
                  label: "Polarized Prescription Sunglasses",
                  desc: "Full UV400 shield and anti-glare for outdoor glare elimination",
                  icon: Sparkles,
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setPrescriptionType(item.label);
                      setStep("LIFESTYLE");
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500/10 group-hover:text-amber-600 transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep("FINISH")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← Back to Finish Selection
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: DAILY LIFESTYLE & SCREEN HABITS                      */}
        {/* ============================================================ */}
        {step === "LIFESTYLE" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">
                Lifestyle Calibration
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                What does your typical daily routine look like?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                We balance temple pressure, nose pad mechanics, and frame weight for all-day endurance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  label: "💻 Heavy Digital Work & Screens (8+ Hours Daily)",
                  desc: "Ultra-lightweight TR90 or titanium with zero pressure points",
                },
                {
                  label: "☀ Active Outdoor, Commuting & Travel",
                  desc: "Resilient structural hinges, sweat resistance, and secure nose grip",
                },
                {
                  label: "👔 Corporate Executive & Client-Facing",
                  desc: "Polished luxury aesthetics that exude authority and quiet elegance",
                },
                {
                  label: "🎨 Creative Studio, Design & Fashion",
                  desc: "Architectural geometries and distinct silhouettes for personal style",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setLifestyle(item.label);
                    setStep("BUDGET");
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep("PRESCRIPTION")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← Back to Prescription
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: BUDGET RANGE & TRIGGER GENERATION                    */}
        {/* ============================================================ */}
        {step === "BUDGET" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">
                Budget Alignment
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                What is your preferred frame budget range?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                All frames include our 1-year structural guarantee and complimentary hard case.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: "Under Rs. 2,500", val: 2500, tag: "Value Essentials" },
                { label: "Rs. 2,500 – Rs. 4,500", val: 4500, tag: "Signature Favorites" },
                { label: "Rs. 4,500 – Rs. 8,000", val: 8000, tag: "Premium Acetate & Metal" },
                { label: "Luxury Choice (No Cap)", val: 15000, tag: "Masterpiece Tier" },
              ].map((b) => (
                <button
                  key={b.val}
                  onClick={() => {
                    setBudget(b.val);
                    handleFetchRecommendations(b.val);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 hover:shadow-md transition-all text-center group cursor-pointer space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                    {b.tag}
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {b.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep("LIFESTYLE")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← Back to Lifestyle
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LOADING STATE WITH OPTICAL CALIBRATION ANIMATION             */}
        {/* ============================================================ */}
        {step === "LOADING" && (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div className="absolute -inset-2 rounded-full border border-amber-500/20 animate-ping opacity-30" />
            </div>

            <div className="space-y-2 max-w-sm px-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600">
                Master Optician AI
              </span>
              <h4 className="text-sm font-bold text-slate-900 transition-all duration-300 min-h-[40px] flex items-center justify-center">
                {loadingMessages[loadingMessageIndex]}
              </h4>
              <p className="text-xs text-slate-500">
                Evaluating {products.length} live catalog models against your facial geometry ({faceShape}) and {metalPreference}.
              </p>
            </div>

            <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RESULTS: BESPOKE RECOMMENDATIONS                             */}
        {/* ============================================================ */}
        {step === "RESULTS" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tailored Optical Match</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Here are your top 3 master-curated frames calibrated for your <strong className="text-white">{faceShape}</strong> face shape, <strong className="text-white">{metalPreference}</strong> palette, and daily optical routine.
              </p>
            </div>

            <div className="space-y-3">
              {recommendedItems.map(({ product, reason, opticalFit }, idx) => (
                <div
                  key={product.id || idx}
                  onClick={() => {
                    onSelectProduct(product);
                    handleClose();
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-900 hover:shadow-lg transition-all cursor-pointer group space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    {/* Frame Image */}
                    <div className="relative w-20 h-16 bg-slate-50 rounded-xl border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        className="object-contain p-1 group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          Match #{idx + 1}
                        </span>
                        {opticalFit && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            {opticalFit}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 truncate mt-1 group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h4>

                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-extrabold text-slate-900">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium">
                          {formatFrameShape(product.frameShape)} / {formatMaterial(product.material)}
                        </span>
                      </div>
                    </div>

                    {/* View Button */}
                    <button className="text-xs bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl group-hover:bg-amber-500 transition-colors shrink-0 shadow-xs flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Optician Styling Rationale */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">
                      Master Optician Rationale:
                    </span>
                    &ldquo;{reason}&rdquo;
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={handleReset}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer py-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Start New Consultation</span>
              </button>

              <button
                onClick={handleClose}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Close Stylist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If used inside an external modal
  if (isModal) {
    if (!isWidgetOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl transform transition-all">
          {consultativeWidgetContent}
        </div>
      </div>
    );
  }

  // Standalone floating widget (optional bottom-right trigger)
  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      {!isWidgetOpen ? (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="group bg-slate-950 hover:bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 border border-slate-800 cursor-pointer active:scale-95"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-[9px] uppercase tracking-widest text-amber-400 font-extrabold">MY EYES</span>
            <span className="block text-xs font-bold tracking-wide text-white">AI Optical Stylist</span>
          </div>
        </button>
      ) : (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-center justify-center sm:block p-4 sm:p-0 bg-slate-950/60 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none">
          {consultativeWidgetContent}
        </div>
      )}
    </div>
  );
}
