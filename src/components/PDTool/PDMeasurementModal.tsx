"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  X,
  Ruler,
  Camera,
  CreditCard,
  Eye,
  Sun,
  ArrowRight,
  RefreshCw,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface PDMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (result: PDMeasurementResult) => void;
  onApplyPD?: (pd: { totalPD: number; rightPD: number; leftPD: number }) => void;
}

type Step = "guide" | "capture" | "calibrate" | "manual" | "uploading" | "result";

// ─── Component ────────────────────────────────────────────────────────────────

export function PDMeasurementModal({
  isOpen,
  onClose,
  onConfirm,
  onApplyPD,
}: PDMeasurementModalProps) {
  // Step Workflow: 'guide' -> 'capture' -> 'calibrate' -> 'result'
  const [step, setStep] = useState<Step>("guide");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pdResult, setPdResult] = useState<PDResult | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [manualPD, setManualPD] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const editorRef = useRef<PDCanvasEditorHandle>(null);

  // Initialize camera stream ONLY when user reaches 'capture' step
  useEffect(() => {
    let active = true;

    if (isOpen && step === "capture") {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera access error:", err);
          if (active) {
            setCameraError("Camera access denied or unavailable. You can enter your PD manually.");
          }
        });
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, step]);

  // Lock body scroll & reset to guide upon opening
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("guide");
      setCapturedImage(null);
      setPdResult(null);
      setCanvasError(null);
      setUploadStatus("idle");
      setAssetUrl(null);
      setManualPD("");
      setManualError(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Trap ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw unmirrored frame to preserve accurate left/right datum
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(v, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedImage(dataUrl);
      setStep("calibrate");
    }
  }, []);

  const handleResultChange = useCallback(
    (result: PDResult | null, error: string | null) => {
      setPdResult(result);
      setCanvasError(error);
    },
    []
  );

  const handleConfirmCalibration = useCallback(async () => {
    const result = editorRef.current?.getPDResult() || pdResult;
    if (!result) {
      setCanvasError("Please adjust the markers until a valid PD is computed.");
      return;
    }

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
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    }

    setPdResult(result);
    setStep("result");
  }, [capturedImage, pdResult]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const error = validateManualPD(manualPD);
    if (error) {
      setManualError(error);
      return;
    }
    const num = parseFloat(manualPD);
    const half = Math.round((num / 2) * 100) / 100;
    const res: PDResult = {
      binocularPD: num,
      rightPD: half,
      leftPD: num - half,
      pixelsPerMm: 0,
      withinTolerance: true,
      confidence: 1,
    };
    setPdResult(res);
    setStep("result");
  }, [manualPD]);

  const handleApplyResult = useCallback(() => {
    if (!pdResult) return;

    onConfirm?.({
      binocularPD: pdResult.binocularPD,
      rightPD: pdResult.rightPD,
      leftPD: pdResult.leftPD,
      imageAssetUrl: assetUrl ?? undefined,
      method: capturedImage ? "camera" : "manual",
    });

    onApplyPD?.({
      totalPD: pdResult.binocularPD,
      rightPD: pdResult.rightPD,
      leftPD: pdResult.leftPD,
    });

    onClose();
  }, [pdResult, assetUrl, capturedImage, onConfirm, onApplyPD, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="PD Measurement Studio"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-4 sm:gap-5 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#ff7a00] shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                PD Measurement Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-tight mt-0.5 truncate">
                Sub-millimeter optical pupillary distance measurement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {step === "capture" && !cameraError && (
              <div className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Optical Camera Active</span>
              </div>
            )}

            <button
              type="button"
              id="pd-close-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Step Viewport */}
        {step === "guide" ? (
          /* STEP 1: INSTRUCTION TAB / ONBOARDING SCREEN */
          <div className="w-full flex flex-col gap-6 py-2">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                How to Measure Your Pupillary Distance
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Follow these 3 quick steps using any standard plastic ID or card as a reference.
              </p>
            </div>

            {/* Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Step 1 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col items-center text-center space-y-2.5 shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#ff7a00]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">1. Hold Card Under Chin</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Place any standard ID or bank card horizontally flat beneath your chin or against your forehead.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col items-center text-center space-y-2.5 shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#ff7a00]">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">2. Look Straight Ahead</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Look directly into the camera lens with your head level and centered within the oval guide.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col items-center text-center space-y-2.5 shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#ff7a00]">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">3. Ensure Good Lighting</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Face a window or bright light source so your pupils and card corners are crisp and clear.
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Footer & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="pd-start-camera-btn"
                onClick={() => setStep("capture")}
                className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Start Measurement Camera</span>
                <ArrowRight className="w-4 h-4 text-[#ff7a00]" />
              </button>

              <button
                type="button"
                id="pd-guide-manual-btn"
                onClick={() => setStep("manual")}
                className="w-full sm:w-auto py-3.5 px-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Ruler className="w-4 h-4 text-slate-400" />
                <span>Enter PD Manually</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-normal text-center">
              Standard Reference: ISO/IEC 7810 ID-1 card dimensions (85.60 mm)
            </p>
          </div>
        ) : (
          /* STEP 2-5: CAMERA, CALIBRATION, MANUAL, & RESULT VIEWPORTS */
          <>
            {/* Viewport Frame */}
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 shadow-inner">
              {/* 1. Camera Capture Stream */}
              {step === "capture" && (
                <>
                  {!cameraError ? (
                    <>
                      {/* Mirrored Video Stream */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                      />

                      {/* Optical Corner Brackets */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 rounded-tl-md pointer-events-none" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 rounded-tr-md pointer-events-none" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 rounded-bl-md pointer-events-none" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 rounded-br-md pointer-events-none" />

                      {/* Central Guidance Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-44 sm:w-56 h-60 sm:h-72 border-2 border-dashed border-amber-400/70 rounded-full relative">
                          <div className="w-full h-px bg-amber-400/40 absolute top-1/2 left-0" />
                        </div>
                        <div className="mt-3 px-3 py-1 bg-slate-950/70 border border-slate-700/60 rounded-full backdrop-blur-xs">
                          <span className="text-[10px] text-amber-300 font-medium">
                            Hold standard card under chin
                          </span>
                        </div>
                      </div>

                      {/* Floating Snapshot Trigger */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                        <button
                          type="button"
                          id="pd-capture-photo-btn"
                          onClick={handleCapture}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-900 font-semibold text-xs shadow-lg backdrop-blur-md transition active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#ff7a00]" />
                          <span>Capture Photo</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => setStep("manual")}
                        className="px-4 py-2 bg-[#ff7a00] text-white text-xs font-bold rounded-full hover:bg-amber-600 transition cursor-pointer"
                      >
                        Enter PD Manually
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 2. Interactive Calibration Canvas */}
              {step === "calibrate" && capturedImage && (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                  <PDCanvasEditor
                    ref={editorRef}
                    imageDataUrl={capturedImage}
                    onResultChange={handleResultChange}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* 3. Uploading Loader */}
              {step === "uploading" && (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center bg-slate-900 w-full h-full">
                  <Loader2 className="w-8 h-8 text-[#ff7a00] animate-spin" />
                  <p className="text-sm font-bold text-white">Analysing Optical Frame&hellip;</p>
                  <p className="text-xs text-slate-400">Applying sub-millimetre ISO/IEC 7810 calibration</p>
                </div>
              )}

              {/* 4. Manual Input View */}
              {step === "manual" && (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-900 w-full h-full">
                  <form
                    onSubmit={handleManualSubmit}
                    className="bg-white/95 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-[#ff7a00]" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Manual Optical Entry
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="manual-pd-val" className="text-xs font-semibold text-slate-700">
                        Binocular Pupillary Distance
                      </label>
                      <div className="relative">
                        <input
                          id="manual-pd-val"
                          type="number"
                          min={50}
                          max={78}
                          step={0.5}
                          value={manualPD}
                          onChange={(e) => {
                            setManualPD(e.target.value);
                            setManualError(null);
                          }}
                          placeholder="e.g. 63.5"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00]"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          mm
                        </span>
                      </div>
                      {manualError && (
                        <p className="text-[11px] text-rose-500 font-medium">{manualError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                    >
                      Confirm Manual PD
                    </button>
                  </form>
                </div>
              )}

              {/* 5. Result View */}
              {step === "result" && pdResult && (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-900 w-full h-full">
                  <div className="bg-white/95 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-150">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Calculated Pupillary Distance
                      </span>
                      <div className="text-3xl font-extrabold text-slate-900 mt-1">
                        {pdResult.binocularPD}&nbsp;
                        <span className="text-base font-bold text-slate-500">mm</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Right Eye (OD)
                        </span>
                        <p className="text-sm font-extrabold text-slate-800">{pdResult.rightPD} mm</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Left Eye (OS)
                        </span>
                        <p className="text-sm font-extrabold text-slate-800">{pdResult.leftPD} mm</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("guide");
                          setCapturedImage(null);
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Retake
                      </button>
                      <button
                        type="button"
                        id="pd-apply-prescription-btn"
                        onClick={handleApplyResult}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#ff7a00] hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply to Prescription</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Toolbar Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {step === "capture" && (
                  <>
                    <button
                      type="button"
                      id="pd-back-instructions-btn"
                      onClick={() => setStep("guide")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      <span>Back to Instructions</span>
                    </button>
                    <button
                      type="button"
                      id="pd-switch-manual-btn"
                      onClick={() => setStep("manual")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Enter Manually</span>
                    </button>
                  </>
                )}

                {step === "calibrate" && (
                  <>
                    <button
                      type="button"
                      id="pd-confirm-markers-btn"
                      onClick={handleConfirmCalibration}
                      disabled={!pdResult || !!canvasError}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs shadow transition active:scale-95 cursor-pointer",
                        pdResult && !canvasError
                          ? "bg-slate-900 hover:bg-black text-white"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Markers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                  </>
                )}

                {step === "manual" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep("guide")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      <span>Back to Instructions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Use Camera Instead</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Standard Magnetic Card Reference: 85.60 mm
                </span>
              </div>
            </div>
          </>
        )}

        {/* Privacy Microcopy Footer */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] sm:text-xs text-slate-400 font-normal leading-normal">
            Privacy Notice: Video feeds are processed entirely within your local browser. No video
            or biometric data is saved or uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PDMeasurementModal;
