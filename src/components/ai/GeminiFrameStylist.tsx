"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  ArrowRight,
  RotateCcw,
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
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
}: GeminiFrameStylistProps) {
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
    "Analyzing your face shape and proportions...",
    "Matching your frame finish and style preference...",
    "Checking lens thickness and frame fit...",
    "Selecting your best frame matches...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "LOADING") {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
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
          ? `Selected to balance ${faceShape} facial proportions with comfortable ${metalPreference.toLowerCase()} styling.`
          : idx === 1
          ? `Lightweight, balanced frame ideal for ${lifestyle.toLowerCase()} and ${prescriptionType.toLowerCase()}.`
          : `Versatile classic frame designed for everyday comfort and clean fit.`,
      opticalFit: `Ideal for ${faceShape} face shape`,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl transform transition-all">
        <div className="bg-white w-full h-[620px] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-900">
          {/* Header */}
          <div className="bg-[#0B132B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-white">MY EYES Assistant</h3>
                <p className="text-[11px] text-slate-400">Personalized Frame & Lens Consultation</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Assistant"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar & Step Tracker */}
          {step !== "RESULTS" && step !== "LOADING" && (
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0B132B] text-amber-400 text-[10px] font-bold flex items-center justify-center">
                  {stepNumbers[step]}
                </span>
                <span className="text-slate-800">
                  {step === "FACE" && "Step 1: Face Shape"}
                  {step === "FINISH" && "Step 2: Frame Finish"}
                  {step === "PRESCRIPTION" && "Step 3: Lens Type"}
                  {step === "LIFESTYLE" && "Step 4: Daily Lifestyle"}
                  {step === "BUDGET" && "Step 5: Budget Range"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s <= stepNumbers[step] ? "w-6 bg-[#F59E0B]" : "w-2.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50">
            {/* STEP 1: FACE SHAPE */}
            {step === "FACE" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900">What is your face shape?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select your face shape to find frames with the most flattering proportions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { shape: "Oval", desc: "Balanced proportions and softly rounded curves" },
                    { shape: "Round", desc: "Similar width and length with soft cheekbones" },
                    { shape: "Square", desc: "Strong, defined jawline and broad forehead" },
                    { shape: "Heart", desc: "Wider forehead tapering to a narrower chin" },
                    { shape: "Diamond", desc: "Defined cheekbones with narrower forehead and chin" },
                    { shape: "Oblong", desc: "Longer face profile with straight cheek lines" },
                  ].map(({ shape, desc }) => (
                    <button
                      key={shape}
                      onClick={() => {
                        setFaceShape(shape);
                        setStep("FINISH");
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0B132B] hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {shape}
                        </div>
                        <div className="text-[11px] text-slate-500">{desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: FRAME FINISH */}
            {step === "FINISH" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900">Which frame finish do you prefer?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Choose the color and material tone that best matches your personal style.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      label: "Classic Matte Black",
                      desc: "Versatile, high-contrast, timeless look",
                      colorCode: "bg-slate-900",
                    },
                    {
                      label: "Warm Gold & Champagne",
                      desc: "Rich, polished metallic finish with warm tones",
                      colorCode: "bg-amber-400",
                    },
                    {
                      label: "Cool Silver & Gunmetal",
                      desc: "Modern, minimal, understated finish",
                      colorCode: "bg-slate-400",
                    },
                    {
                      label: "Tortoise Shell & Amber",
                      desc: "Classic pattern with rich warm depth",
                      colorCode: "bg-amber-800",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setMetalPreference(item.label);
                        setStep("PRESCRIPTION");
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0B132B] hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
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

            {/* STEP 3: LENS TYPE */}
            {step === "PRESCRIPTION" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900">What type of lenses do you need?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    We ensure recommended frames comfortably support your lens prescription.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      label: "Single Vision (Everyday Glasses)",
                      desc: "For general distance or reading prescription",
                      icon: Eye,
                    },
                    {
                      label: "Blue Light Screen Protection",
                      desc: "Anti-glare lenses designed for long hours at computers",
                      icon: Glasses,
                    },
                    {
                      label: "High Index Thin Lenses",
                      desc: "For stronger prescriptions requiring slim, sturdy frame rims",
                      icon: ShieldCheck,
                    },
                    {
                      label: "Progressive / Bifocal",
                      desc: "Comfortable corridor height for near and far vision",
                      icon: SlidersHorizontal,
                    },
                    {
                      label: "Polarized Sunglasses",
                      desc: "Full UV protection and outdoor glare reduction",
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
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0B132B] hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
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
                    ← Back to Frame Finish
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: LIFESTYLE */}
            {step === "LIFESTYLE" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900">What is your daily use?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    We select lightweight and durable frames matched to your routine.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      label: "💻 Heavy Computer / Screen Use",
                      desc: "Lightweight and pressure-free for all-day focus",
                    },
                    {
                      label: "☀ Outdoor, Travel & Commuting",
                      desc: "Secure grip, durable hinges, and sturdy construction",
                    },
                    {
                      label: "👔 Office & Formal Wear",
                      desc: "Clean, professional, and elegant design",
                    },
                    {
                      label: "🎨 Casual & Everyday Fashion",
                      desc: "Comfortable, stylish frames for daily wear",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setLifestyle(item.label);
                        setStep("BUDGET");
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0B132B] hover:shadow-md transition-all text-left group cursor-pointer flex items-center justify-between"
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
                    ← Back to Lens Type
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: BUDGET */}
            {step === "BUDGET" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900">What is your budget?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select your preferred price range.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { label: "Under Rs. 2,500", val: 2500 },
                    { label: "Rs. 2,500 – Rs. 4,500", val: 4500 },
                    { label: "Rs. 4,500 – Rs. 8,000", val: 8000 },
                    { label: "All Prices", val: 15000 },
                  ].map((b) => (
                    <button
                      key={b.val}
                      onClick={() => {
                        setBudget(b.val);
                        handleFetchRecommendations(b.val);
                      }}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0B132B] hover:shadow-md transition-all text-center group cursor-pointer"
                    >
                      <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
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

            {/* LOADING STATE */}
            {step === "LOADING" && (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B] animate-pulse">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: "5s" }} />
                </div>

                <div className="space-y-1.5 max-w-sm px-4">
                  <h4 className="text-sm font-bold text-slate-900 min-h-[24px]">
                    {loadingMessages[loadingMessageIndex]}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Finding the best frame matches for your {faceShape} face shape.
                  </p>
                </div>

                <div className="w-40 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {/* RESULTS */}
            {step === "RESULTS" && (
              <div className="space-y-4">
                <div className="bg-[#0B132B] text-white p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Your Recommended Frames</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Top 3 matches selected for your <strong className="text-white">{faceShape}</strong> face shape and <strong className="text-white">{metalPreference}</strong> preference.
                  </p>
                </div>

                <div className="space-y-3">
                  {recommendedItems.map(({ product, reason, opticalFit }, idx) => (
                    <div
                      key={product.id || idx}
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#0B132B] hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-16 bg-slate-50 rounded-xl border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              Match #{idx + 1}
                            </span>
                            {opticalFit && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                {opticalFit}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 truncate mt-1 group-hover:text-amber-600 transition-colors">
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

                        <button className="text-xs bg-[#0B132B] text-white font-bold px-3.5 py-2 rounded-xl group-hover:bg-[#F59E0B] transition-colors shrink-0 shadow-xs flex items-center gap-1">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
                        &ldquo;{reason}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer py-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Start Over</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
