"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
  Glasses,
  Sun,
} from "lucide-react";
import LogoLoader from "@/components/ui/LogoLoader";
import { QuizAnswers, QUIZ_STEPS } from "@/lib/quizData";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice } from "@/lib/utils";
import PrescriptionModal from "@/components/PrescriptionModal";
import { useCartStore } from "@/store/useCartStore";
import { useDiscount } from "@/hooks/useDiscount";

interface ScoredProduct extends SafeProduct {
  matchScore: number;
  matchPercent: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MATCH BADGE
// ─────────────────────────────────────────────────────────────────────────────
function MatchBadge({ percent }: { percent: number }) {
  const color =
    percent >= 85
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : percent >= 70
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${color}`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      {percent}% Match
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESULT PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ResultProductCard({
  product,
  onCustomize,
}: {
  product: ScoredProduct;
  onCustomize: (p: ScoredProduct) => void;
}) {
  const { getPricing } = useDiscount();
  const pricing = getPricing(product.price);
  const imgUrl = product.firstImage || "/placeholder-frame.png";

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white hover:shadow-lg transition-all duration-300 group">
      {/* Match badge & Promotional OFF badge overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[75%]">
        <MatchBadge percent={product.matchPercent} />
        {pricing.hasDiscount && pricing.badgeText && (
          <span className="bg-neutral-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase shadow-sm">
            {pricing.badgeText}
          </span>
        )}
      </div>

      {/* 1. PRODUCT CARD IMAGE CONTAINER */}
      <Link href={`/products/${product.slug}`} className="block relative w-full aspect-[4/3] sm:aspect-[16/11] bg-neutral-100 overflow-hidden">
        <Image
          alt={product.name}
          className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          src={imgUrl}
        />
        {/* Category Badge positioned cleanly inside top-right */}
        <span className="absolute top-3 right-3 z-10 bg-[#0F172A]/90 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
          {product.category || "Eyeglasses"}
        </span>
      </Link>

      {/* 2. CARD CONTENT PADDING & SEPARATION */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span>{product.formattedShape}</span>
            <span>{product.formattedMaterial}</span>
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-bold text-slate-900 text-sm leading-snug hover:underline line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price + CTAs */}
        <div className="pt-3 border-t border-slate-100 mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                {pricing.formattedFinalPrice}
              </span>
              {pricing.hasDiscount && pricing.formattedOriginalPrice && (
                <span className="line-through text-neutral-400 text-xs">
                  {pricing.formattedOriginalPrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {product.gender}
            </span>
          </div>

          <button
            id={`quiz-customize-${product.id}`}
            onClick={() => onCustomize(product)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Select &amp; Customize
          </button>

          <Link
            href={`/products/${product.slug}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
          >
            View Frame Details
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTIVE FILTER TAG
// ─────────────────────────────────────────────────────────────────────────────
function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-700">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-amber-200 hover:bg-amber-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILD FILTER TAGS from quiz answers
// ─────────────────────────────────────────────────────────────────────────────
interface FilterTag {
  key: string;
  label: string;
}

function buildFilterTags(answers: QuizAnswers): FilterTag[] {
  const tags: FilterTag[] = [];

  if (answers.category && answers.category !== "all") {
    tags.push({ key: "category", label: answers.category === "EYEGLASSES" ? "Eyeglasses" : "Sunglasses" });
  }

  if (answers.gender && answers.gender !== "all") {
    const gLabel = Array.isArray(answers.gender) ? answers.gender[0] : String(answers.gender);
    tags.push({ key: "gender", label: gLabel });
  }

  if (answers.frameShapes && answers.frameShapes.length > 0) {
    // Find the step 5 options that match
    const step5 = QUIZ_STEPS.find((s) => s.step === 5);
    if (step5) {
      const matchedOption = step5.options.find((o) => {
        const vals = Array.isArray(o.dbValue) ? o.dbValue : [o.dbValue];
        return (answers.frameShapes || []).some((s) => vals.includes(s));
      });
      if (matchedOption) {
        tags.push({ key: "frameShape", label: matchedOption.label });
      }
    }
  }

  if (answers.material && answers.material !== "all" && answers.material !== "NILL") {
    const matMap: Record<string, string> = {
      ACETATE: "Acetate",
      TITANIUM: "Titanium / Metal",
      HYBRID: "Mixed Media",
      METAL: "Metal",
    };
    tags.push({ key: "material", label: matMap[answers.material] || answers.material });
  }

  if (answers.colorPalette && answers.colorPalette.length > 0) {
    const colorMap: Record<string, string> = {
      black: "Black",
      tortoise: "Tortoise",
      crystal: "Crystal Clear",
      grey: "Grey",
      amber: "Amber",
      gold: "Gold",
      silver: "Silver",
      rose_gold: "Rose Gold",
      red: "Red",
      blue: "Blue",
      teal: "Teal",
      green: "Green",
      orange: "Orange",
      pink: "Pink",
      purple: "Purple",
    };
    answers.colorPalette.slice(0, 2).forEach((c) => {
      tags.push({ key: `color-${c}`, label: colorMap[c] || c });
    });
  }

  return tags;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SKELETON LOADING GRID
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white animate-pulse flex flex-col justify-between overflow-hidden">
          <div className="w-full aspect-[4/3] sm:aspect-[16/11] bg-slate-200/60" />
          <div className="p-4 sm:p-5 space-y-3 flex-1">
            <div className="h-3 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
            <div className="h-8 bg-slate-200 rounded-xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESULTS INNER — reads searchParams
// ─────────────────────────────────────────────────────────────────────────────
function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [allProducts, setAllProducts] = useState<ScoredProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ScoredProduct[]>([]);
  const [activeTags, setActiveTags] = useState<FilterTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ScoredProduct | null>(null);
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());

  // ── Parse answers from URL ─────────────────────────────────────────────────
  useEffect(() => {
    const q = searchParams.get("q");
    let parsed: QuizAnswers = {};

    if (q) {
      try {
        parsed = JSON.parse(atob(q));
      } catch {
        // Try session storage fallback
        try {
          const saved = sessionStorage.getItem("myeyes-quiz-state");
          if (saved) {
            const { answers: savedAnswers } = JSON.parse(saved);
            parsed = savedAnswers || {};
          }
        } catch {
          parsed = {};
        }
      }
    } else {
      // Try session storage
      try {
        const saved = sessionStorage.getItem("myeyes-quiz-state");
        if (saved) {
          const { answers: savedAnswers } = JSON.parse(saved);
          parsed = savedAnswers || {};
        }
      } catch {
        parsed = {};
      }
    }

    setAnswers(parsed);
    setActiveTags(buildFilterTags(parsed));
  }, [searchParams]);

  // ── Fetch scored results from API ───────────────────────────────────────────
  useEffect(() => {
    if (!answers || Object.keys(answers).length === 0) return;

    setLoading(true);
    setError(null);

    fetch("/api/quiz/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAllProducts(data.results || []);
          setFilteredProducts(data.results || []);
        } else {
          setError("Could not compute results. Please try again.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error. Please check your connection.");
        setLoading(false);
      });
  }, [answers]);

  // ── Remove a filter tag and re-filter products ──────────────────────────────
  const removeTag = useCallback(
    (tagKey: string) => {
      const newRemoved = new Set(removedKeys);
      newRemoved.add(tagKey);
      setRemovedKeys(newRemoved);

      const newTags = activeTags.filter((t) => t.key !== tagKey);
      setActiveTags(newTags);

      // Re-filter in-memory: if a major filter removed, show more results
      if (tagKey === "category") {
        setFilteredProducts(allProducts);
      } else if (tagKey === "gender") {
        setFilteredProducts(allProducts.filter((p) => !newRemoved.has("category") || p.category === answers.category));
      } else if (tagKey === "frameShape") {
        // Just allow all shapes in the scored list
        setFilteredProducts(allProducts.slice(0, 24));
      } else if (tagKey === "material") {
        setFilteredProducts(filteredProducts.filter((p) => p.material !== "NILL") || allProducts);
      } else if (tagKey.startsWith("color-")) {
        // Remove color filter — show all in existing set
        setFilteredProducts(allProducts.slice(0, 24));
      }
    },
    [activeTags, allProducts, filteredProducts, removedKeys, answers]
  );

  const retakeQuiz = () => {
    sessionStorage.removeItem("myeyes-quiz-state");
    router.push("/quiz");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  RESULTS HEADER                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-600">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Your Personalized Style Results
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Your Perfect Frames Await
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Matched across {Object.keys(answers).length} style criteria —
            sorted by highest compatibility.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  ACTIVE FILTER PILL BAR                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTags.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Filters:
              </span>
              {activeTags.map((tag) => (
                <FilterTag
                  key={tag.key}
                  label={tag.label}
                  onRemove={() => removeTag(tag.key)}
                />
              ))}
              {activeTags.length > 1 && (
                <button
                  onClick={() => {
                    setActiveTags([]);
                    setFilteredProducts(allProducts);
                    setRemovedKeys(new Set(activeTags.map((t) => t.key)));
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline cursor-pointer ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  RESULTS COUNT                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!loading && !error && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {filteredProducts.length > 0 ? (
                <>
                  Showing{" "}
                  <span className="text-amber-600 font-extrabold">{filteredProducts.length}</span>{" "}
                  matched frames
                </>
              ) : (
                "No frames matched your criteria — try removing a filter above."
              )}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sorted by highest match
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  PRODUCT GRID                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-12 text-center space-y-3">
            <p className="text-slate-600 font-medium">{error}</p>
            <button
              onClick={retakeQuiz}
              className="text-sm font-bold text-amber-600 underline"
            >
              Retake the quiz
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center space-y-4">
            <div className="text-5xl">🕶️</div>
            <p className="text-slate-600 font-semibold">
              No exact matches found — try removing some filters above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <ResultProductCard
                key={product.id}
                product={product}
                onCustomize={(p) => {
                  setSelectedProduct(p);
                  setRxModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  ACTION FOOTER                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-4">
          <button
            id="quiz-retake-btn"
            onClick={retakeQuiz}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>

          <Link
            href="/eyeglasses"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-black transition-all"
          >
            <Glasses className="w-4 h-4" />
            Explore Full Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/sunglasses"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-all"
          >
            <Sun className="w-4 h-4" />
            Browse Sunglasses
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/*  PRESCRIPTION MODAL                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {rxModalOpen && selectedProduct && (
        <PrescriptionModal
          isOpen={rxModalOpen}
          onClose={() => {
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price}
          onSubmit={(details, totalPrice) => {
            addItem({
              productId: selectedProduct.id,
              name: `${selectedProduct.name} (${details.lensUsage})`,
              price: totalPrice,
              image: selectedProduct.firstImage || "",
              prescription: details,
            });
            setRxModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE WRAPPER with Suspense (required for useSearchParams in Next.js App Router)
// ─────────────────────────────────────────────────────────────────────────────
export default function QuizResultsPage() {
  return (
    <Suspense fallback={<LogoLoader text="CURATING YOUR PERSONALIZED OPTICAL RESULTS..." />}>
      <ResultsInner />
    </Suspense>
  );
}
