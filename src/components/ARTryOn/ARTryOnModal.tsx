"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  X,
  Loader2,
  Camera,
  SlidersHorizontal,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ARTryOnCanvasHandle } from "./ARTryOnCanvas";
import { getFrontFacingProductImage } from "@/lib/optical/productImageHelper";

// Dynamic import for AR canvas (avoids SSR + heavy Three.js on initial load)
import dynamic from "next/dynamic";
const ARTryOnCanvas = dynamic(() => import("./ARTryOnCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-900 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
      <p className="text-xs font-semibold text-white/70 tracking-wide">
        Initializing 3D Optical Matrix&hellip;
      </p>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFrame {
  id: string;
  name: string;
  imageUrl: string;
  modelGlbUrl?: string | null;
}

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selected product image URL (from product page) */
  initialImageUrl?: string;
  /** Pre-selected product ID */
  initialProductId?: string;
  /** Pre-selected 3D GLB model URL */
  initialModelGlbUrl?: string | null;
}

type LensTint = "clear" | "blue" | "amber";

const TINT_OPTIONS: { id: LensTint; label: string; desc: string }[] = [
  { id: "clear", label: "Clear Optical", desc: "Standard clear optical lenses" },
  { id: "blue",  label: "Blue Light Shield", desc: "Digital screen protection filter" },
  { id: "amber", label: "Sunglass Polarized", desc: "Full UV & outdoor tint" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ARTryOnModal({
  isOpen,
  onClose,
  initialImageUrl,
  initialProductId,
  initialModelGlbUrl,
}: ARTryOnModalProps) {
  const canvasRef  = useRef<ARTryOnCanvasHandle>(null);
  const dockRef    = useRef<HTMLDivElement>(null);

  const [frames, setFrames]         = useState<ProductFrame[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialProductId ?? "");
  const [currentImage, setCurrentImage] = useState<string>(
    initialImageUrl || "/placeholder-glasses.png"
  );
  const [currentModelGlbUrl, setCurrentModelGlbUrl] = useState<string | null>(
    initialModelGlbUrl || null
  );
  const [fitOffset, setFitOffset]   = useState<number>(0);
  const [lensTint, setLensTint]     = useState<LensTint>("clear");
  const [loadingFrames, setLoadingFrames] = useState(false);
  const [showFit, setShowFit]       = useState(false);

  // Sync initial product props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialProductId) {
        setSelectedId(initialProductId);
      }
      if (initialImageUrl) {
        setCurrentImage(getFrontFacingProductImage({ images: initialImageUrl }));
      }
      if (initialModelGlbUrl !== undefined) {
        setCurrentModelGlbUrl(initialModelGlbUrl);
      }
    }
  }, [isOpen, initialProductId, initialImageUrl, initialModelGlbUrl]);

  // Load product catalog for frame switcher
  useEffect(() => {
    if (!isOpen) return;
    setLoadingFrames(true);

    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string; images?: string | string[]; frontImage?: string; imageUrl?: string; modelGlbUrl?: string | null }>) => {
        if (!Array.isArray(data)) return;
        const mapped: ProductFrame[] = data
          .map((p) => {
            const frontUrl = getFrontFacingProductImage(p);
            return {
              id: p.id,
              name: p.name,
              imageUrl: frontUrl,
              modelGlbUrl: p.modelGlbUrl || null,
            };
          })
          .filter((f) => f.imageUrl && f.imageUrl.trim().length > 0);

        setFrames(mapped);

        // If no initial selection, select first product
        if (!initialProductId && mapped.length > 0 && !initialImageUrl) {
          setSelectedId(mapped[0].id);
          setCurrentImage(mapped[0].imageUrl);
          setCurrentModelGlbUrl(mapped[0].modelGlbUrl || null);
        }
      })
      .catch((err) => {
        console.error("Failed to load products for AR try-on:", err);
      })
      .finally(() => setLoadingFrames(false));
  }, [isOpen, initialProductId, initialImageUrl]);

  // Trap ESC key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Switch frame texture smoothly
  const handleSelectFrame = useCallback((frame: ProductFrame) => {
    setSelectedId(frame.id);
    setCurrentImage(frame.imageUrl);
    setCurrentModelGlbUrl(frame.modelGlbUrl || null);
  }, []);

  // Capture
  const handleCapture = useCallback(() => {
    canvasRef.current?.capturePhoto();
  }, []);

  // Carousel dock scroll
  const scrollDock = useCallback((dir: "left" | "right") => {
    const el = dockRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Virtual 3D Try-On"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full sm:max-w-4xl max-h-[96vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100/80 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-[#ff7a00]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
                Virtual 3D Try-On
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real-time 3D frame fitting calibrated to your facial dimensions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Optical Camera Active
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-4 sm:px-6 pb-6 pt-4 overflow-y-auto space-y-4">
          {/* AR Canvas */}
          <ARTryOnCanvas
            ref={canvasRef}
            imageUrl={currentImage}
            modelGlbUrl={currentModelGlbUrl}
            fitOffset={fitOffset}
            lensTint={lensTint}
            className="w-full"
          />

          {/* Interactive Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Capture Photo */}
            <button
              id="ar-modal-capture-btn"
              type="button"
              onClick={handleCapture}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-full shadow transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Photo</span>
            </button>

            {/* Fit Adjustment Toggle */}
            <button
              id="ar-fit-toggle-btn"
              type="button"
              onClick={() => setShowFit((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer",
                showFit
                  ? "bg-amber-50 border-amber-200/60 text-[#ff7a00]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Fit Adjustment</span>
            </button>

            {/* Lens Tint Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              {TINT_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  id={`ar-tint-${t.id}-btn`}
                  type="button"
                  title={t.desc}
                  onClick={() => setLensTint(t.id)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer",
                    lensTint === t.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fit Adjustment Slider */}
          {showFit && (
            <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 shrink-0">
                Nasal Bridge Height
              </span>
              <input
                id="ar-fit-slider"
                type="range"
                min={-5}
                max={5}
                step={0.5}
                value={fitOffset}
                onChange={(e) => setFitOffset(parseFloat(e.target.value))}
                className="flex-1 accent-[#ff7a00] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-600 w-12 text-right shrink-0">
                {fitOffset > 0 ? `+${fitOffset}` : fitOffset} mm
              </span>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100/80 rounded-xl px-3.5 py-3">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Privacy Notice: Video feeds are processed entirely within your local browser.
              No video or biometric data is saved or uploaded.
            </p>
          </div>

          {/* Frame Switcher Dock */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Frame Style
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollDock("left")}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollDock("right")}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loadingFrames ? (
              <div className="h-20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : (
              <div
                ref={dockRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x"
              >
                {frames.map((frame) => {
                  const isSelected = frame.id === selectedId;
                  return (
                    <button
                      key={frame.id}
                      id={`ar-frame-${frame.id}`}
                      type="button"
                      onClick={() => handleSelectFrame(frame)}
                      className={cn(
                        "relative shrink-0 w-24 h-16 rounded-xl border-2 overflow-hidden transition-all snap-start cursor-pointer",
                        isSelected
                          ? "border-[#ff7a00] shadow-md shadow-amber-100 ring-2 ring-[#ff7a00]/30"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      )}
                      title={frame.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.imageUrl}
                        alt={frame.name}
                        className="w-full h-full object-contain bg-slate-50 p-1"
                      />
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff7a00] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
