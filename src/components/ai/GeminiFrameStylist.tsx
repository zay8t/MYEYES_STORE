"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, X, Loader2, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";

interface GeminiFrameStylistProps {
  products: SafeProduct[];
  onSelectProduct: (product: SafeProduct) => void;
}

export default function GeminiFrameStylist({ products, onSelectProduct }: GeminiFrameStylistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"FACE" | "LIFESTYLE" | "BUDGET" | "LOADING" | "RESULTS">("FACE");

  const [faceShape, setFaceShape] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [budget, setBudget] = useState(5000);
  const [recommendedItems, setRecommendedItems] = useState<{ product: SafeProduct; reason: string }[]>([]);

  const handleFetchRecommendations = async (selectedBudget: number) => {
    setStep("LOADING");
    try {
      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceShape, lifestyle, budget: selectedBudget, products }),
      });
      const data = await res.json();

      if (data.recommendations && data.recommendations.length > 0) {
        const mapped = data.recommendations.map((rec: { id: string; reason: string }) => {
          const prod = products.find((p) => p.id === rec.id) || products[0];
          return { product: prod, reason: rec.reason };
        });
        setRecommendedItems(mapped);
      } else {
        setRecommendedItems(
          products.slice(0, 3).map((p) => ({
            product: p,
            reason: "Classic silhouette tailored for all-day precision comfort and balanced proportions.",
          }))
        );
      }
      setStep("RESULTS");
    } catch (err) {
      console.error(err);
      setRecommendedItems(
        products.slice(0, 3).map((p) => ({
          product: p,
          reason: "Handcrafted frame matching your tailored optical profile.",
        }))
      );
      setStep("RESULTS");
    }
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

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-neutral-900 hover:bg-black text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 border border-neutral-800 cursor-pointer active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Gemini Powered</span>
            <span className="block text-xs font-bold tracking-wide text-white">AI Optical Stylist</span>
          </div>
        </button>
      ) : (
        <div className="bg-white w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white">MY EYES Studio</h3>
                <p className="text-[10px] text-neutral-400 font-light">Interactive Gemini Consultation</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs bg-neutral-50/50 scrollbar-none">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                AI
              </div>
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-neutral-200/80 text-neutral-800 shadow-2xs leading-relaxed font-medium">
                Welcome to our luxury consultation. Let&apos;s find your bespoke frame match. What is your face shape?
              </div>
            </div>

            {step === "FACE" && (
              <div className="grid grid-cols-2 gap-2.5 pl-9 pt-1">
                {["Oval", "Round", "Square", "Heart"].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => {
                      setFaceShape(shape);
                      setStep("LIFESTYLE");
                    }}
                    className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-900 hover:text-white font-semibold text-neutral-700 transition-all text-center shadow-2xs cursor-pointer group flex items-center justify-between px-4"
                  >
                    <span>{shape}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {faceShape && (
              <div className="flex justify-end pl-9">
                <div className="bg-neutral-900 text-white px-4 py-2 rounded-2xl rounded-tr-none font-medium shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{faceShape} Face Shape</span>
                </div>
              </div>
            )}

            {step === "LIFESTYLE" && (
              <>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    AI
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-neutral-200/80 text-neutral-800 shadow-2xs leading-relaxed font-medium">
                    Excellent proportion. What is your primary daily optical requirement?
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-9 pt-1">
                  {[
                    { label: "💻 Heavy Screen Time (Blue-Light Guard)", val: "screen" },
                    { label: "☀ Outdoor & Driving (Polarized / UV)", val: "outdoor" },
                    { label: "👓 Everyday Prescription Frames", val: "general" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setLifestyle(item.label);
                        setStep("BUDGET");
                      }}
                      className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-900 hover:text-white font-medium text-neutral-700 transition-all text-left shadow-2xs cursor-pointer flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {lifestyle && (
              <div className="flex justify-end pl-9">
                <div className="bg-neutral-900 text-white px-4 py-2 rounded-2xl rounded-tr-none font-medium shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lifestyle}</span>
                </div>
              </div>
            )}

            {step === "BUDGET" && (
              <>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    AI
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-neutral-200/80 text-neutral-800 shadow-2xs leading-relaxed font-medium">
                    Almost complete. What is your preferred budget range?
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pl-9 pt-1">
                  {[
                    { label: "Under Rs. 2,500", val: 2500 },
                    { label: "Rs. 2,500 - 5,000+", val: 5000 },
                  ].map((b) => (
                    <button
                      key={b.val}
                      onClick={() => {
                        setBudget(b.val);
                        handleFetchRecommendations(b.val);
                      }}
                      className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-900 hover:text-white font-bold text-neutral-700 transition-all text-center shadow-2xs cursor-pointer"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "LOADING" && (
              <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-neutral-200/80 p-6 mx-2">
                <Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
                <p className="text-neutral-700 font-bold text-xs">Consulting Gemini AI Optical Engine...</p>
                <p className="text-neutral-500 text-[11px]">Analyzing facial ergonomics and catalog inventory</p>
              </div>
            )}

            {step === "RESULTS" && (
              <>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    AI
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-neutral-200/80 text-neutral-800 shadow-2xs leading-relaxed font-medium">
                    ✨ Here are your bespoke frame recommendations curated by Gemini:
                  </div>
                </div>

                <div className="space-y-3 pl-9 pt-1">
                  {recommendedItems.map(({ product, reason }, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectProduct(product);
                        setIsOpen(false);
                      }}
                      className="p-3.5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 cursor-pointer transition-all shadow-2xs space-y-2 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-neutral-50 rounded-xl p-1 border border-neutral-100 shrink-0 overflow-hidden">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 truncate text-xs">{product.name}</h4>
                          <p className="text-xs font-semibold text-amber-700">Rs. {product.price}/-</p>
                        </div>
                        <span className="text-[10px] bg-neutral-900 text-white px-2.5 py-1.5 rounded-xl font-bold group-hover:bg-amber-500 transition-colors shrink-0">
                          View
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 italic leading-snug border-t border-neutral-100 pt-2">
                        &ldquo;{reason}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setStep("FACE");
                    setFaceShape("");
                    setLifestyle("");
                  }}
                  className="w-full mt-3 text-center text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Consultation</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
