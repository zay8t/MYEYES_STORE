"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  X,
  Ruler,
  Camera,
  Sparkles,
  Check,
  Loader2,
  ChevronLeft,
  AlertCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CameraCapture, { CameraCaptureHandle } from "./CameraCapture";
import PDCanvasEditor, { PDCanvasEditorHandle } from "./PDCanvasEditor";
import { PDResult, validateManualPD } from "@/lib/optical/pdCalculator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDMeasurementResult {
  binocularPD: number;
  rightPD: number;
  leftPD: number;
  imageAssetUrl?: string;
  method: "camera" | "manual";
}

interface PDMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: PDMeasurementResult) => void;
}

type Step = "intro" | "camera" | "calibrate" | "manual" | "uploading" | "result";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PDMeasurementModal({
  isOpen,
  onClose,
  onConfirm,
}: PDMeasurementModalProps) {
  const [step, setStep] = useState<Step>("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pdResult, setPdResult] = useState<PDResult | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [manualPD, setManualPD] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const cameraRef = useRef<CameraCaptureHandle>(null);
  const editorRef = useRef<PDCanvasEditorHandle>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("intro");
      setCapturedImage(null);
      setPdResult(null);
      setCanvasError(null);
      setUploadStatus("idle");
      setAssetUrl(null);
      setManualPD("");
      setManualError(null);
    }
  }, [isOpen]);

  // Trap ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
    setStep("calibrate");
  }, []);

  const handleCameraError = useCallback((msg: string) => {
    setCanvasError(msg);
  }, []);

  const handleResultChange = useCallback(
    (result: PDResult | null, error: string | null) => {
      setPdResult(result);
      setCanvasError(error);
    },
    []
  );

  const handleConfirmCalibration = useCallback(async () => {
    const result = editorRef.current?.getPDResult();
    if (!result) {
      setCanvasError("Please adjust the markers until a valid PD is computed.");
      return;
    }

    // Silent upload
    setStep("uploading");
    setUploadStatus("uploading");

    try {
      const res = await fetch("/api/upload/pd-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: capturedImage }),
      });
      const data = await res.json();
      if (data.success && data.assetUrl) {
        setAssetUrl(data.assetUrl);
        setUploadStatus("done");
      } else {
        // Non-blocking — proceed without URL
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    }

    setPdResult(result);
    setStep("result");
  }, [capturedImage]);

  const handleManualSubmit = useCallback(() => {
    const error = validateManualPD(manualPD);
    if (error) {
      setManualError(error);
      return;
    }
    const num = parseFloat(manualPD);
    const half = Math.round((num / 2) * 100) / 100;
    setPdResult({
      binocularPD: num,
      rightPD: half,
      leftPD: num - half,
      pixelsPerMm: 0,
      withinTolerance: true,
      confidence: 1,
    });
    setStep("result");
  }, [manualPD]);

  const handleConfirmResult = useCallback(() => {
    if (!pdResult) return;
    onConfirm({
      binocularPD: pdResult.binocularPD,
      rightPD: pdResult.rightPD,
      leftPD: pdResult.leftPD,
      imageAssetUrl: assetUrl ?? undefined,
      method: capturedImage ? "camera" : "manual",
    });
    onClose();
  }, [pdResult, assetUrl, capturedImage, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="PD Measurement Studio"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[96vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100/80 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Ruler className="w-4.5 h-4.5 text-[#ff7a00]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
                PD Measurement Studio
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Sub-millimetre optical calibration
              </p>
            </div>
          </div>

          {/* Back / Close */}
          <div className="flex items-center gap-1.5">
            {(step === "camera" || step === "calibrate" || step === "manual") && (
              <button
                onClick={() =>
                  step === "calibrate"
                    ? setStep("camera")
                    : setStep("intro")
                }
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 pb-6 pt-5 overflow-y-auto">

          {/* ── INTRO ──────────────────────────────────────────────── */}
          {step === "intro" && (
            <div className="space-y-5">
              {/* What is PD */}
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-900 mb-1">
                  What is Pupillary Distance (PD)?
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  PD is the distance in millimetres between your two pupils. It ensures your
                  optical lenses are perfectly centred — critical for clear, comfortable vision.
                  A misaligned PD causes eye strain and distorted clarity.
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                {[
                  {
                    icon: Camera,
                    title: "Prepare your ID / credit card",
                    desc: "Hold it horizontally under your chin, facing the camera — it acts as our calibration reference.",
                  },
                  {
                    icon: Ruler,
                    title: "Take a straight-on photo",
                    desc: "Look directly at the camera, face centred and level. Good lighting makes a big difference.",
                  },
                  {
                    icon: Sparkles,
                    title: "Refine the markers",
                    desc: "Drag the pupil and card markers to align precisely. Our engine computes your PD to ±0.25 mm.",
                  },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100/80 rounded-xl px-3.5 py-3">
                <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your photo is used only for optical measurement and securely stored for your order.
                  It is never shared with third parties or used for any other purpose.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  id="pd-start-camera-btn"
                  onClick={() => setStep("camera")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-2xl shadow transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera Measurement
                </button>
                <button
                  id="pd-enter-manual-btn"
                  onClick={() => setStep("manual")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95"
                >
                  <Ruler className="w-4 h-4" />
                  Enter PD Manually
                </button>
              </div>
            </div>
          )}

          {/* ── CAMERA ─────────────────────────────────────────────── */}
          {step === "camera" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500">
                Position your face in the oval guide and hold your ID card below your chin, then tap&nbsp;
                <strong className="text-slate-800">Capture Frame</strong>.
              </p>
              <CameraCapture
                ref={cameraRef}
                onCapture={handleCapture}
                onError={handleCameraError}
              />
              {canvasError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600 font-medium">{canvasError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── CALIBRATE ──────────────────────────────────────────── */}
          {step === "calibrate" && capturedImage && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500">
                Drag the markers to align precisely with your pupils and the card edges.
              </p>
              <PDCanvasEditor
                ref={editorRef}
                imageDataUrl={capturedImage}
                onResultChange={handleResultChange}
              />
              {canvasError && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">{canvasError}</p>
                </div>
              )}
              <button
                id="pd-confirm-calibration-btn"
                onClick={handleConfirmCalibration}
                disabled={!pdResult || !!canvasError}
                className={cn(
                  "w-full py-3 text-sm font-bold rounded-2xl transition-all active:scale-95",
                  pdResult && !canvasError
                    ? "bg-slate-900 hover:bg-black text-white shadow"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                Confirm Measurement
              </button>
            </div>
          )}

          {/* ── UPLOADING ──────────────────────────────────────────── */}
          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Analysing Optical Frame&hellip;</p>
              <p className="text-xs text-slate-400">Applying sub-millimetre calibration</p>
            </div>
          )}

          {/* ── MANUAL ─────────────────────────────────────────────── */}
          {step === "manual" && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Find your PD on your prescription slip or ask your optician.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  It is usually labelled as <strong>PD</strong>, <strong>Dist PD</strong>, or{" "}
                  <strong>Pupillary Distance</strong> and ranges from 52 to 74 mm for most adults.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="manual-pd-input"
                  className="text-xs font-bold text-slate-700"
                >
                  Binocular PD (mm)
                </label>
                <div className="relative">
                  <input
                    id="manual-pd-input"
                    type="number"
                    min={52}
                    max={74}
                    step={0.5}
                    value={manualPD}
                    onChange={(e) => {
                      setManualPD(e.target.value);
                      setManualError(null);
                    }}
                    placeholder="e.g. 63.5"
                    className={cn(
                      "w-full pl-4 pr-12 py-3 rounded-xl text-sm font-semibold text-slate-900 bg-white border transition focus:outline-none focus:ring-2",
                      manualError
                        ? "border-rose-300 focus:ring-rose-200"
                        : "border-slate-200 focus:ring-[#ff7a00]/25 focus:border-[#ff7a00]"
                    )}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    mm
                  </span>
                </div>
                {manualError && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {manualError}
                  </p>
                )}
              </div>

              <button
                id="pd-manual-submit-btn"
                onClick={handleManualSubmit}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-2xl shadow transition-all active:scale-95"
              >
                Apply PD Measurement
              </button>
            </div>
          )}

          {/* ── RESULT ─────────────────────────────────────────────── */}
          {step === "result" && pdResult && (
            <div className="space-y-5">
              {/* Success badge */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-600 stroke-[2.5]" />
                </div>
                <p className="text-base font-extrabold text-slate-900">
                  Measurement Complete
                </p>
                {uploadStatus === "uploading" && (
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Optimising Optical Frame&hellip;
                  </p>
                )}
              </div>

              {/* Measurement card */}
              <div className="bg-slate-50 border border-slate-100/80 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 grid grid-cols-3 divide-x divide-slate-100">
                  {[
                    { label: "Binocular PD", value: `${pdResult.binocularPD} mm` },
                    { label: "Right Eye (OD)", value: `${pdResult.rightPD} mm` },
                    { label: "Left Eye (OS)", value: `${pdResult.leftPD} mm` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 leading-none">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                {pdResult.confidence < 0.8 && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-amber-50/60 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Low symmetry detected — consider retaking or entering manually for best accuracy.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="pd-retake-btn"
                  onClick={() => {
                    setStep("intro");
                    setCapturedImage(null);
                    setPdResult(null);
                  }}
                  className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Retake
                </button>
                <button
                  id="pd-apply-btn"
                  onClick={handleConfirmResult}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ff7a00] hover:bg-amber-600 text-white text-sm font-bold rounded-2xl shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply to Prescription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
