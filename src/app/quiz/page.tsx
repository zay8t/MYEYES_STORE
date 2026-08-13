"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import { QUIZ_STEPS, QuizAnswers, TOTAL_STEPS, QuizOption, FrameShapeDB } from "@/lib/quizData";
import QuizProgressBar from "@/components/quiz/QuizProgressBar";
import ShapeCard from "@/components/quiz/ShapeCard";
import ColorSwatchCard from "@/components/quiz/ColorSwatchCard";

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
  Blend: Layers, // fallback
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

// ─────────────────────────────────────────────────────────────────────────────
//  OPTION ICON — stable sub-component so no "component created in render" error
// ─────────────────────────────────────────────────────────────────────────────
function OptionIcon({ name, className }: { name?: string; className?: string }) {
  if (!name || !ICON_MAP[name]) return null;
  const IconComponent = ICON_MAP[name];
  return <IconComponent className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STANDARD OPTION CARD — for steps 1-4, 6-7
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
      className={`
        relative w-full flex flex-col items-start gap-3 p-5 rounded-2xl border-2 cursor-pointer
        transition-all duration-200 text-left group
        ${selected
          ? "border-[#F59E0B] bg-gradient-to-br from-amber-50/60 to-amber-50/20 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
          : "border-slate-200/80 bg-white hover:border-[#F59E0B] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        }
      `}
    >
      {/* Selected badge */}
      {selected && (
        <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Icon */}
      {option.icon && ICON_MAP[option.icon] && (
        <div className={`p-2.5 rounded-xl transition-colors ${selected ? "bg-amber-100 text-[#D97706]" : "bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-[#F59E0B]"}`}>
          <OptionIcon name={option.icon} className="w-5 h-5" />
        </div>
      )}

      {/* Text */}
      <div className="space-y-0.5 pr-8">
        <div className={`text-sm font-bold leading-tight ${selected ? "text-[#D97706]" : "text-slate-900"}`}>
          {option.label}
        </div>
        {option.sublabel && (
          <div className="text-[11px] font-medium text-slate-500">{option.sublabel}</div>
        )}
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
//  INTERSTITIAL LOADER
// ─────────────────────────────────────────────────────────────────────────────
function InterstitialLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-8 px-8">
      {/* Pulsing Lens Icon */}
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

      {/* Text */}
      <div className="text-center space-y-3 max-w-md">
        <h2 className="text-xl font-bold text-slate-900">
          Curating Your Personal Collection
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Filtering our catalog &amp; calculating match scores across 8 style criteria...
        </p>
      </div>

      {/* Animated dots */}
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
//  MAIN QUIZ PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  // Per-step selected option ids
  const [selectedIds, setSelectedIds] = useState<Record<number, string[]>>({});
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // ignore parse errors
    }
  }, []);

  // ── Persist state to sessionStorage whenever it changes ────────────────────
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "myeyes-quiz-state",
        JSON.stringify({ step: currentStep, answers, selectedIds })
      );
    } catch {
      // ignore storage errors
    }
  }, [currentStep, answers, selectedIds]);

  // ── Navigate forward with animation ────────────────────────────────────────
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
      // Last step done → show interstitial then navigate
      setShowLoader(true);
      setTimeout(() => {
        const answersB64 = btoa(JSON.stringify(answers));
        router.push(`/quiz/results?q=${answersB64}`);
      }, 1400);
    }
  }, [currentStep, isAnimating, answers, router]);

  // ── Navigate backward with animation ───────────────────────────────────────
  const goBack = useCallback(() => {
    if (isAnimating || currentStep <= 1) return;
    setAnimDir("backward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s - 1);
      setIsAnimating(false);
    }, 220);
  }, [currentStep, isAnimating]);

  // ── Skip current step ───────────────────────────────────────────────────────
  const skipStep = useCallback(() => {
    goForward();
  }, [goForward]);

  // ── Handle option selection ─────────────────────────────────────────────────
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

      // Update answers based on option's dbField
      setAnswers((prev) => {
        const newAnswers = { ...prev };
        if (step.multiSelect) {
          // Toggle in array
          if (option.dbField === "frameShapes") {
            const cur = (prev.frameShapes || []) as FrameShapeDB[];
            const vals = Array.isArray(option.dbValue) ? option.dbValue as FrameShapeDB[] : [option.dbValue as FrameShapeDB];
            const hasAll = vals.every((v) => cur.includes(v));
            newAnswers.frameShapes = hasAll
              ? cur.filter((v) => !vals.includes(v))
              : [...cur, ...vals.filter((v) => !cur.includes(v))];
          } else if (option.dbField === "colorPalette") {
            const cur = prev.colorPalette || [];
            const val = option.dbValue as string;
            newAnswers.colorPalette = cur.includes(val)
              ? cur.filter((v) => v !== val)
              : [...cur, val];
          }
        } else {
          // Single select
          (newAnswers as Record<string, unknown>)[option.dbField] = option.dbValue;
        }
        return newAnswers;
      });

      // Auto-advance for single-select steps with 250ms delay
      if (!isMulti) {
        autoAdvanceTimer.current = setTimeout(() => {
          goForward();
        }, 280);
      }
    },
    [currentStep, step, goForward]
  );

  // ── Cleanup timer on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  if (!step) return null;

  const stepSelectedIds = selectedIds[currentStep] || [];
  const hasSelection = stepSelectedIds.length > 0;

  // ── Slide animation classes ─────────────────────────────────────────────────
  const animClass = isAnimating
    ? animDir === "forward"
      ? "opacity-0 -translate-x-4"
      : "opacity-0 translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <>
      {showLoader && <InterstitialLoader />}

      <div className="min-h-screen bg-white flex flex-col">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  TOP HEADER BAR                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-[68px] flex items-center gap-3">
            {/* Back button */}
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

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="relative w-7 h-7">
                <Image src="/logo.svg" alt="My Eyes" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-sm font-extrabold tracking-wider text-amber-600 uppercase hidden sm:inline">
                MY EYES
              </span>
            </Link>

            {/* Progress bar */}
            <QuizProgressBar currentStep={currentStep} />

            {/* Skip button */}
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
        {/*  QUIZ CONTENT                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14">
          <div
            className={`w-full max-w-3xl transition-all duration-200 ease-out ${animClass}`}
          >
            {/* Step Title + Subtitle */}
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

            {/* ── STEP 5: Shape Cards (SVG Silhouettes) ────────────────────── */}
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
              /* ── STEP 8: Color Swatch Cards ─────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              /* ── STEPS 1-4, 6-7: Standard Icon Cards ────────────────────── */
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

            {/* ── MULTI-SELECT CONTINUE BUTTON ─────────────────────────────── */}
            {step.multiSelect && (
              <div className="mt-8 flex justify-center">
                <button
                  id="quiz-continue-btn"
                  onClick={goForward}
                  disabled={!hasSelection}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200
                    ${hasSelection
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

            {/* Skip hint for non-selected single-select steps */}
            {!step.multiSelect && !hasSelection && currentStep > 1 && (
              <p className="text-center text-[11px] text-slate-400 mt-6">
                Not sure? Press{" "}
                <button onClick={skipStep} className="text-amber-500 font-semibold underline">
                  Skip this step
                </button>{" "}
                to continue with general recommendations.
              </p>
            )}
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  FOOTER HINT                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <footer className="py-4 text-center">
          <p className="text-[10px] text-slate-300 font-medium">
            Your selections are saved automatically • Style Quiz by MY EYES
          </p>
        </footer>
      </div>
    </>
  );
}
