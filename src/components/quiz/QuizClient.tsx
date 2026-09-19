"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Glasses,
  Sun,
  Sparkles,
  User,
  Users,
  Clock,
  Monitor,
  BookOpen,
  Mountain,
  Layers,
  Zap,
  Star,
  Minimize2,
  AlignCenter,
  Maximize2,
  HelpCircle,
  Minus,
  ChevronDown,
  Settings2,
  CheckCircle,
  UserCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { QUIZ_STEPS, QuizAnswers, TOTAL_STEPS, QuizOption, FrameShapeDB } from "@/lib/quizData";
import QuizProgressBar from "@/components/quiz/QuizProgressBar";
import ShapeCard from "@/components/quiz/ShapeCard";
import ColorSwatchCard from "@/components/quiz/ColorSwatchCard";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice, formatMaterial, formatFrameShape } from "@/lib/utils";
import LikeButton from "@/components/products/LikeButton";
import { useDiscount } from "@/hooks/useDiscount";
import LensConfiguratorModal from "@/components/configurator/LensConfiguratorModal";

// ─────────────────────────────────────────────────────────────────────────────
//  ICON MAP — maps icon name strings from quizData to Lucide components
// ─────────────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Glasses,
  Sun,
  Sparkles,
  User,
  Users,
  UserCircle,
  Clock,
  Monitor,
  BookOpen,
  Mountain,
  Layers,
  Zap,
  Blend: Layers,
  Star,
  Minimize2,
  AlignCenter,
  Maximize2,
  HelpCircle,
  Minus,
  ChevronDown,
  Settings2,
  CheckCircle,
};

function OptionIcon({ name, className }: { name?: string; className?: string }) {
  if (!name || !ICON_MAP[name]) return null;
  const IconComponent = ICON_MAP[name];
  return <IconComponent className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STANDARD OPTION CARD
// ─────────────────────────────────────────────────────────────────────────────
function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: QuizOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      id={`quiz-option-${option.id}`}
      onClick={onSelect}
      type="button"
      className={`
        relative w-full flex flex-col items-start gap-3 p-5 rounded-2xl border-2 cursor-pointer
        transition-all duration-200 text-left group
        ${
          selected
            ? "border-[#F59E0B] bg-gradient-to-br from-amber-50/60 to-amber-50/20 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
            : "border-slate-200/80 bg-white hover:border-[#F59E0B] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        }
      `}
    >
      {selected && (
        <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {option.icon && ICON_MAP[option.icon] && (
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            selected ? "bg-amber-100 text-[#D97706]" : "bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-[#F59E0B]"
          }`}
        >
          <OptionIcon name={option.icon} className="w-5 h-5" />
        </div>
      )}

      <div className="space-y-0.5 pr-8">
        <div className={`text-sm font-bold leading-tight ${selected ? "text-[#D97706]" : "text-slate-900"}`}>
          {option.label}
        </div>
        {option.sublabel && <div className="text-[11px] font-medium text-slate-500">{option.sublabel}</div>}
        {option.hint && (
          <div className={`text-[10px] font-semibold mt-1.5 ${selected ? "text-amber-600" : "text-slate-400"}`}>
            {option.hint}
          </div>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FACE SHAPE DATA & GEOMETRY RULES
// ─────────────────────────────────────────────────────────────────────────────
type FaceShapeId = "oval" | "round" | "square" | "heart";

interface FaceShapeRule {
  id: FaceShapeId;
  label: string;
  tagline: string;
  recommendedDescription: string;
  targetShapeKeys: string[];
}

const FACE_SHAPE_RULES: FaceShapeRule[] = [
  {
    id: "oval",
    label: "Oval",
    tagline: "Balanced proportions with a soft jawline",
    recommendedDescription: "Versatile frames like Wayfarer, Cat Eye, or Oval",
    targetShapeKeys: ["WAYFARER", "CAT_EYE", "OVAL"],
  },
  {
    id: "round",
    label: "Round",
    tagline: "Curved cheekbones with equal width and length",
    recommendedDescription: "Angular frames like Rectangle, Square, or Geometric",
    targetShapeKeys: ["RECTANGLE", "SQUARE", "GEOMETRIC"],
  },
  {
    id: "square",
    label: "Square",
    tagline: "Prominent jawline with balanced width and angles",
    recommendedDescription: "Curved frames like Round, Aviator, or Cat Eye",
    targetShapeKeys: ["ROUND", "AVIATOR", "CAT_EYE", "OVAL"],
  },
  {
    id: "heart",
    label: "Heart",
    tagline: "Broader forehead tapering to a delicate chin",
    recommendedDescription: "Versatile frames like Wayfarer, Cat Eye, or Oval",
    targetShapeKeys: ["WAYFARER", "CAT_EYE", "OVAL"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  QUIZ PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
function QuizProductCard({
  product,
  onAddLenses,
}: {
  product: SafeProduct;
  onAddLenses: (product: SafeProduct) => void;
}) {
  const { getPricing } = useDiscount();
  const pricing = getPricing(product.price);
  const imgUrl =
    product.images && product.images.length > 0 && product.images[0] !== "/logo.png"
      ? product.images[0]
      : "/placeholder-frame.png";

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/90 bg-white hover:shadow-lg transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block absolute inset-0 w-full h-full">
          <Image
            src={imgUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Category & Promo Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap max-w-[75%] pointer-events-none">
          <span className="bg-[#0F172A]/90 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
            {product.category || "Eyeglasses"}
          </span>
          {pricing.hasDiscount && pricing.badgeText && (
            <span className="bg-neutral-900/90 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
              {pricing.badgeText}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <LikeButton productId={product.id} size="sm" />
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{formatFrameShape(product.frameShape)}</span>
          <span>{formatMaterial(product.material)}</span>
        </div>

        <div>
          <Link href={`/products/${product.slug}`}>
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#ff7a00] transition-colors">
              {product.name}
            </h4>
          </Link>
          {product.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">
              {pricing.formattedFinalPrice}
            </span>
            {pricing.hasDiscount && pricing.formattedOriginalPrice && (
              <span className="text-neutral-400 text-xs line-through">
                {pricing.formattedOriginalPrice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddLenses(product)}
            className="h-[32px] px-3.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>Add Lenses</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERSTITIAL LOADER
// ─────────────────────────────────────────────────────────────────────────────
function InterstitialLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-8 px-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center animate-pulse">
          <svg
            viewBox="0 0 120 60"
            className="w-16 h-10 text-[#F59E0B]"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <ellipse cx="30" cy="30" rx="22" ry="18" />
            <ellipse cx="90" cy="30" rx="22" ry="18" />
            <line x1="52" y1="30" x2="68" y2="30" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
        <div className="absolute -inset-3 rounded-full bg-amber-400/10 animate-ping" style={{ animationDelay: "0.15s" }} />
      </div>

      <div className="text-center space-y-3 max-w-md">
        <h2 className="text-xl font-bold text-slate-900">
          Curating Your Personal Collection
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Filtering our database &amp; calculating match scores across your optical criteria...
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN QUIZ CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export interface QuizClientProps {
  initialProducts?: SafeProduct[];
}

export default function QuizClient({ initialProducts = [] }: QuizClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selectedIds, setSelectedIds] = useState<Record<number, string[]>>({});
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected Face Shape for Quick Matching Section
  const [activeFaceShape, setActiveFaceShape] = useState<FaceShapeId>("oval");

  // Modal State for Lens Configurator
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);

  const step = QUIZ_STEPS[currentStep - 1];

  // ── Restore state from sessionStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("myeyes-quiz-state");
      if (saved) {
        const { step: savedStep, answers: savedAnswers, selectedIds: savedIds } = JSON.parse(saved);
        if (savedStep && savedAnswers && savedIds) {
          setCurrentStep(savedStep);
          setAnswers(savedAnswers);
          setSelectedIds(savedIds);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Persist state to sessionStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "myeyes-quiz-state",
        JSON.stringify({ step: currentStep, answers, selectedIds })
      );
    } catch {
      // ignore
    }
  }, [currentStep, answers, selectedIds]);

  // ── Navigation functions ────────────────────────────────────────────────────
  const goForward = useCallback(() => {
    if (isAnimating) return;
    if (currentStep < TOTAL_STEPS) {
      setAnimDir("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setIsAnimating(false);
      }, 220);
    } else {
      setShowLoader(true);
      setTimeout(() => {
        const answersB64 = btoa(JSON.stringify(answers));
        router.push(`/quiz/results?q=${answersB64}`);
      }, 1400);
    }
  }, [currentStep, isAnimating, answers, router]);

  const goBack = useCallback(() => {
    if (isAnimating || currentStep <= 1) return;
    setAnimDir("backward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s - 1);
      setIsAnimating(false);
    }, 220);
  }, [currentStep, isAnimating]);

  const skipStep = useCallback(() => {
    goForward();
  }, [goForward]);

  const handleSelect = useCallback(
    (option: QuizOption) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);

      const stepNum = currentStep;
      const isMulti = step.multiSelect;

      setSelectedIds((prev) => {
        const current = prev[stepNum] || [];
        let next: string[];
        if (isMulti) {
          next = current.includes(option.id)
            ? current.filter((id) => id !== option.id)
            : [...current, option.id];
        } else {
          next = [option.id];
        }
        return { ...prev, [stepNum]: next };
      });

      setAnswers((prev) => {
        const newAnswers = { ...prev };
        if (step.multiSelect) {
          if (option.dbField === "frameShapes") {
            const cur = (prev.frameShapes || []) as FrameShapeDB[];
            const vals = Array.isArray(option.dbValue) ? (option.dbValue as FrameShapeDB[]) : [option.dbValue as FrameShapeDB];
            const hasAll = vals.every((v) => cur.includes(v));
            newAnswers.frameShapes = hasAll
              ? cur.filter((v) => !vals.includes(v))
              : [...cur, ...vals.filter((v) => !cur.includes(v))];
          } else if (option.dbField === "colorPalette") {
            const cur = prev.colorPalette || [];
            const val = option.dbValue as string;
            newAnswers.colorPalette = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
          }
        } else {
          (newAnswers as Record<string, unknown>)[option.dbField] = option.dbValue;
        }
        return newAnswers;
      });

      if (!isMulti) {
        autoAdvanceTimer.current = setTimeout(() => {
          goForward();
        }, 280);
      }
    },
    [currentStep, step, goForward]
  );

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  // ── Compute Live Matched Products based on Geometry Rules ───────────────────
  const currentRule = useMemo(
    () => FACE_SHAPE_RULES.find((r) => r.id === activeFaceShape) || FACE_SHAPE_RULES[0],
    [activeFaceShape]
  );

  const matchedFaceProducts = useMemo(() => {
    if (!initialProducts || initialProducts.length === 0) return [];

    const filtered = initialProducts.filter((p) => {
      const pShape = (p.frameShape || "").toUpperCase();
      return currentRule.targetShapeKeys.includes(pShape);
    });

    if (filtered.length >= 3) {
      return filtered.slice(0, 4);
    }

    const eyeglasses = initialProducts.filter((p) => p.category === "EYEGLASSES");
    const combined = [...filtered, ...eyeglasses.filter((p) => !filtered.some((f) => f.id === p.id))];
    return combined.slice(0, 4);
  }, [initialProducts, currentRule]);

  const handleOpenLensModal = (p: SafeProduct) => {
    setSelectedProduct(p);
    setRxModalOpen(true);
  };

  const stepSelectedIds = selectedIds[currentStep] || [];
  const hasSelection = stepSelectedIds.length > 0;

  const animClass = isAnimating
    ? animDir === "forward"
      ? "opacity-0 -translate-x-4"
      : "opacity-0 translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <>
      {showLoader && <InterstitialLoader />}

      {/* Lens Configurator Modal */}
      {selectedProduct && (
        <LensConfiguratorModal
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
          frame={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            imageUrl:
              selectedProduct.images && selectedProduct.images.length > 0 && selectedProduct.images[0] !== "/logo.png"
                ? selectedProduct.images[0]
                : "/placeholder-frame.png",
          }}
        />
      )}

      <div className="min-h-screen bg-white flex flex-col">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  TOP HEADER BAR                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-[68px] flex items-center gap-3">
            <button
              onClick={currentStep > 1 ? goBack : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep > 1
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                  : "text-slate-300 cursor-not-allowed"
              }`}
              disabled={currentStep <= 1}
              aria-label="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="relative w-7 h-7">
                <Image src="/logo.svg" alt="My Eyes" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-sm font-extrabold tracking-wider text-amber-600 uppercase hidden sm:inline">
                MY EYES
              </span>
            </Link>

            <QuizProgressBar currentStep={currentStep} />

            <button
              onClick={skipStep}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shrink-0"
            >
              <span>Skip</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  QUIZ MAIN CONTENT                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14">
          <div className={`w-full max-w-3xl transition-all duration-200 ease-out ${animClass}`}>
            <div className="text-center space-y-2 mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Step {currentStep} of {TOTAL_STEPS}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-3">
                {step.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto">
                {step.subtitle}
              </p>
              {step.multiSelect && (
                <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full">
                  ✓ Select multiple options
                </p>
              )}
            </div>

            {/* STEP 5: Shape Cards */}
            {step.step === 5 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {step.options.map((option) => (
                  <ShapeCard
                    key={option.id}
                    option={option}
                    selected={stepSelectedIds.includes(option.id)}
                    onSelect={() => handleSelect(option)}
                  />
                ))}
              </div>
            ) : step.step === 8 ? (
              /* STEP 8: Color Swatches */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {step.options.map((option) => (
                  <ColorSwatchCard
                    key={option.id}
                    option={option}
                    selected={stepSelectedIds.includes(option.id)}
                    onSelect={() => handleSelect(option)}
                  />
                ))}
              </div>
            ) : (
              /* STEPS 1-4, 6-7: Options */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {step.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    selected={stepSelectedIds.includes(option.id)}
                    onSelect={() => handleSelect(option)}
                  />
                ))}
              </div>
            )}

            {/* Multi-Select Continue */}
            {step.multiSelect && (
              <div className="mt-8 flex justify-center">
                <button
                  id="quiz-continue-btn"
                  onClick={goForward}
                  disabled={!hasSelection}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    hasSelection
                      ? "bg-[#F59E0B] text-white hover:bg-[#D97706] hover:-translate-y-0.5 shadow-md hover:shadow-lg cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {currentStep === TOTAL_STEPS ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      See My Matches
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {!step.multiSelect && !hasSelection && currentStep > 1 && (
              <p className="text-center text-[11px] text-slate-400 mt-6">
                Not sure? Press{" "}
                <button onClick={skipStep} className="text-amber-500 font-semibold underline cursor-pointer">
                  Skip this step
                </button>{" "}
                to continue with general recommendations.
              </p>
            )}
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  INSTANT FACE-SHAPE RECOMMENDATION SECTION (DYNAMIC DB PRODUCTS)   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="w-full bg-slate-50/60 border-t border-slate-200/80 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff7a00]">
                QUICK FIT FINDER
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Recommended Frames by Face Shape
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                Select your face shape to see live frames directly matched from our store database using optical geometry rules.
              </p>
            </div>

            {/* Interactive Face-Shape Selector (Oval, Round, Square, Heart) */}
            <div className="flex flex-wrap justify-center gap-2.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-lg mx-auto">
              {FACE_SHAPE_RULES.map((rule) => {
                const isActive = rule.id === activeFaceShape;
                return (
                  <button
                    key={rule.id}
                    onClick={() => setActiveFaceShape(rule.id)}
                    type="button"
                    className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center border cursor-pointer ${
                      isActive
                        ? "bg-amber-50 border-[#ff7a00] text-[#ff7a00] shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <span>{rule.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Geometry Guidance Banner */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong className="text-slate-900 font-bold">{currentRule.label} Face Shape:</strong>{" "}
                  {currentRule.recommendedDescription}.
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {currentRule.tagline}
              </span>
            </div>

            {/* Live Matched Products Grid */}
            {matchedFaceProducts.length === 0 ? (
              <div className="p-12 text-center border border-slate-200 bg-white rounded-2xl text-slate-400 text-xs">
                Loading matching frames from store catalog...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {matchedFaceProducts.map((prod) => (
                  <QuizProductCard
                    key={prod.id}
                    product={prod}
                    onAddLenses={handleOpenLensModal}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-slate-100 bg-white">
          <p className="text-[11px] text-slate-400 font-medium">
            Lab-precision prescription eyewear &amp; live 3D try-on • Handcrafted for MY EYES Pakistan
          </p>
        </footer>
      </div>
    </>
  );
}
