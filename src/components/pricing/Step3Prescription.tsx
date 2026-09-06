"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Calculator,
  Eye,
  Sparkles,
  BookOpen,
  Info,
  Link2,
  Unlink,
  Upload,
  Camera,
  FileText,
  FileCheck2,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compressPrescriptionImage } from "@/lib/image-compression";

export interface EyeRx {
  sph: string;
  cyl: string;
  axis: string;
}

export interface ScannedRxPayload {
  od?: { sph?: string; cyl?: string; axis?: string };
  os?: { sph?: string; cyl?: string; axis?: string };
  add?: string | null;
  pd?: string | null;
}

export interface Step3PrescriptionProps {
  od: EyeRx;
  os: EyeRx;
  odAdd: string;
  osAdd: string;
  addLinked: boolean;
  noRxFallback: boolean;
  isProgressive: boolean;
  effectiveAdd: number;
  onSetEye: (eye: "od" | "os", field: keyof EyeRx, value: string) => void;
  onSetAdd: (which: "od" | "os", value: string) => void;
  onToggleAddLinked: () => void;
  onToggleNoRxFallback: () => void;
  onApplyScannedPrescription?: (data: ScannedRxPayload) => void;
}

export const SPH_MINUS = Array.from({ length: 48 }, (_, i) => (-12.0 + i * 0.25).toFixed(2)).reverse();
export const SPH_PLUS = Array.from({ length: 64 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
export const SPH_ALL = [...SPH_MINUS, "+0.00", ...SPH_PLUS];
export const CYL_MINUS = Array.from({ length: 24 }, (_, i) => (-6.0 + i * 0.25).toFixed(2)).reverse();
export const CYL_PLUS = Array.from({ length: 16 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`);
export const CYL_ALL = [...CYL_MINUS, "+0.00", ...CYL_PLUS];
export const ADD_OPTIONS = Array.from({ length: 12 }, (_, i) => `+${(0.75 + i * 0.25).toFixed(2)}`);
export const AXIS_OPTIONS = Array.from({ length: 180 }, (_, i) => String(i + 1));

export function formatDiopter(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return "+0.00";
  return n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

export function toggleSign(v: string, sign: "+" | "-"): string {
  return `${sign}${Math.abs(parseFloat(v) || 0).toFixed(2)}`;
}

export function getSign(v: string): "+" | "-" {
  return String(v || "").trim().startsWith("-") ? "-" : "+";
}

interface PrescriptionInputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  isAxis?: boolean;
  disabled?: boolean;
}

export function PrescriptionInputGroup({
  label,
  value,
  onChange,
  options,
  isAxis = false,
  disabled = false,
}: PrescriptionInputGroupProps) {
  const sign = getSign(value);

  return (
    <div className={cn("space-y-2", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center justify-between min-h-[32px] gap-1">
        <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase truncate">
          {label}
        </label>
        {!isAxis && (
          <div className="inline-flex rounded-xl p-0.5 sm:p-1 bg-neutral-100 border border-neutral-200/60 text-xs shadow-2xs shrink-0">
            {(["+", "-"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(toggleSign(value, s))}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
                  sign === s
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 font-medium"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <select
        value={isAxis ? value : formatDiopter(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-neutral-900 text-sm font-mono font-bold transition-all outline-none"
      >
        {isAxis ? (
          options.map((o) => (
            <option key={o} value={o}>
              {o}&deg;
            </option>
          ))
        ) : (
          <>
            <optgroup label="Minus (-) Diopters">
              {options
                .filter((o) => o.startsWith("-"))
                .map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Plano / Zero">
              <option value="+0.00">0.00 (Plano)</option>
            </optgroup>
            <optgroup label="Plus (+) Diopters">
              {options
                .filter((o) => o.startsWith("+") && o !== "+0.00")
                .map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </optgroup>
          </>
        )}
      </select>
    </div>
  );
}

export function Step3Prescription({
  od,
  os,
  odAdd,
  osAdd,
  addLinked,
  noRxFallback,
  isProgressive,
  effectiveAdd,
  onSetEye,
  onSetAdd,
  onToggleAddLinked,
  onToggleNoRxFallback,
  onApplyScannedPrescription,
}: Step3PrescriptionProps) {
  // Scanner state
  const [isExpandedScanner, setIsExpandedScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });
  const [scanHighlighted, setScanHighlighted] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File processing & AI Scanner Execution
  const handleFileProcess = useCallback(
    async (rawFile: File) => {
      setFileError(null);
      setIsExpandedScanner(true);

      const MAX_SIZE = 10 * 1024 * 1024;
      if (rawFile.size > MAX_SIZE) {
        setFileError("File size exceeds 10MB limit. Please choose a smaller file.");
        return;
      }

      const isImg = rawFile.type.startsWith("image/");
      const isDoc = rawFile.type === "application/pdf";
      if (!isImg && !isDoc) {
        setFileError("Please upload an image (JPG, PNG, WEBP) or a PDF document.");
        return;
      }

      // Compress client-side for mobile efficiency
      const processedFile = isImg ? await compressPrescriptionImage(rawFile) : rawFile;
      setUploadedFileName(processedFile.name);
      const previewUrl = isImg ? URL.createObjectURL(processedFile) : null;
      setUploadedPreviewUrl(previewUrl);

      // Trigger Gemini AI API
      setIsScanning(true);
      setScanStatus({ type: "idle" });

      try {
        const formData = new FormData();
        formData.append("slip", processedFile);

        const res = await fetch("/api/prescription/scan", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (res.ok && json.success && json.data) {
          if (onApplyScannedPrescription) {
            onApplyScannedPrescription(json.data);
          } else {
            // Fallback manual setter mapping if callback omitted
            const { od: sOd, os: sOs, add: sAdd } = json.data;
            if (sOd?.sph) onSetEye("od", "sph", sOd.sph);
            if (sOd?.cyl) onSetEye("od", "cyl", sOd.cyl);
            if (sOd?.axis) onSetEye("od", "axis", sOd.axis);
            if (sOs?.sph) onSetEye("os", "sph", sOs.sph);
            if (sOs?.cyl) onSetEye("os", "cyl", sOs.cyl);
            if (sOs?.axis) onSetEye("os", "axis", sOs.axis);
            if (sAdd) onSetAdd("od", sAdd);
          }

          setScanStatus({
            type: "success",
            message: "Prescription numbers applied automatically. Please review below.",
          });
          setScanHighlighted(true);
          setTimeout(() => setScanHighlighted(false), 2500);
        } else {
          setScanStatus({
            type: "error",
            message:
              json.error ||
              "Unable to read prescription clearly. Please enter values manually or upload a sharper image.",
          });
        }
      } catch (err) {
        console.warn("Prescription scanner network error:", err);
        setScanStatus({
          type: "error",
          message:
            "Unable to read prescription clearly. Please enter values manually or upload a sharper image.",
        });
      } finally {
        setIsScanning(false);
      }
    },
    [onApplyScannedPrescription, onSetEye, onSetAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileProcess(file);
    },
    [handleFileProcess]
  );

  const clearUploadedSlip = () => {
    setUploadedPreviewUrl(null);
    setUploadedFileName(null);
    setScanStatus({ type: "idle" });
    setFileError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 sm:p-8 border-b border-neutral-100">
      {/* Step Header with Elevated Gemini AI Action Trigger */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
            <Calculator className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Step 3 — Enter Your Eye Numbers
            </h2>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Copy the numbers from your slip or upload a photo to auto-fill with Gemini AI.
              {isProgressive ? " Reading number (ADD) required for all-in-one lenses." : ""}
            </p>
          </div>
        </div>

        {/* Action Button Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Prominent Gemini AI Scan Trigger */}
          <button
            type="button"
            onClick={() => setIsExpandedScanner((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs",
              isExpandedScanner
                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20"
                : "border-amber-400 bg-amber-50/70 hover:bg-amber-100/90 text-amber-950"
            )}
          >
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <span>Scan Prescription Slip with AI</span>
            <span className="hidden sm:inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md">
              Instant AI Fill
            </span>
          </button>

          {/* Fallback estimation toggle */}
          <button
            type="button"
            onClick={onToggleNoRxFallback}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
              noRxFallback
                ? "bg-amber-500/10 border-amber-500/40 text-amber-700"
                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {noRxFallback ? "Using Estimated Numbers" : "Don't have your slip?"}
          </button>
        </div>
      </div>

      {/* Hidden Mobile Camera and Gallery Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileProcess(file);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileProcess(file);
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          EXPANDED GEMINI AI SCANNER DROPZONE & CAMERA PANEL
      ══════════════════════════════════════════════════════════════════════════ */}
      {isExpandedScanner && (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/60 to-white p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                  Gemini Optical AI Scanner
                </h3>
                <p className="text-[11px] text-amber-800/80">
                  Upload or snap a photo of your doctor prescription slip to auto-fill numbers in seconds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpandedScanner(false)}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>

          {uploadedPreviewUrl || uploadedFileName ? (
            /* Uploaded Preview + Radar Scanning Overlay */
            <div className="relative rounded-xl border border-amber-200/80 bg-white overflow-hidden shadow-2xs">
              <div className="relative w-full min-h-[160px] sm:min-h-[200px] bg-slate-50 flex items-center justify-center">
                {uploadedPreviewUrl ? (
                  <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
                    <Image
                      src={uploadedPreviewUrl}
                      alt="Prescription slip preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 max-w-[240px] truncate">
                      {uploadedFileName}
                    </p>
                  </div>
                )}

                {/* Animated Pulsing Radar Scanning Beam Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2.5 p-4 animate-in fade-in">
                    <div className="relative w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping" />
                      <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-amber-300">
                      Scanning Rx details with Gemini AI...
                    </p>
                    <p className="text-[11px] text-slate-300 text-center max-w-[280px]">
                      Analyzing doctor handwriting and detecting SPH, CYL, AXIS &amp; ADD values...
                    </p>
                  </div>
                )}
              </div>

              {/* Slip Action Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-amber-100 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[320px]">
                    {uploadedFileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearUploadedSlip}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    aria-label="Remove slip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag-and-Drop Dropzone & Dual Action Tiles */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "rounded-xl transition-all border-2 border-dashed border-amber-300/80 bg-white/70 p-4 sm:p-6 text-center space-y-3",
                isDragging && "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400"
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {/* Mobile Camera Direct Snap Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-amber-50 hover:bg-amber-100/80 border border-amber-300/80 active:scale-[0.98] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition shadow-2xs group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">Snap with Camera</span>
                    <span className="text-[10px] text-amber-700">Instant mobile capture</span>
                  </div>
                </button>

                {/* Upload from Gallery / Files */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-neutral-50 border border-neutral-200 active:scale-[0.98] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition shadow-2xs group"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">Upload Slip Image</span>
                    <span className="text-[10px] text-neutral-500">JPG, PNG, PDF up to 10MB</span>
                  </div>
                </button>
              </div>

              <p className="text-[11px] text-amber-900/60 font-medium">
                Or drag and drop your prescription slip anywhere inside this box
              </p>
            </div>
          )}

          {/* Validation & Scan Feedback Status Messages */}
          {fileError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {scanStatus.type === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scanStatus.message}</span>
            </div>
          )}

          {scanStatus.type === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{scanStatus.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Fallback info notice */}
      {noRxFallback && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 font-medium">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Using estimated numbers:</strong>{" "}
            {isProgressive
              ? "Standard baseline applied with entry reading addition (+1.50). Your final price may adjust when you enter your slip."
              : "Standard baseline applied (zero power). Enter your actual slip numbers for your exact price."}
          </span>
        </div>
      )}

      {isProgressive && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 font-medium">
          <strong>Pupillary Distance (PD):</strong> For all-in-one lenses, our team will message you on WhatsApp after your order to help measure your eye distance easily.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          OD & OS EYE INPUT CARDS (WITH EMERALD GLOW ON SCAN SUCCESS)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Eye (OD) */}
        <div
          className={cn(
            "p-5 rounded-2xl border transition-all duration-500 space-y-4",
            scanHighlighted
              ? "border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-50/40 shadow-md shadow-emerald-500/10"
              : "border-neutral-200/80 bg-neutral-50/30",
            noRxFallback && "opacity-50"
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Right Eye (OD)
              </span>
            </div>
            {scanHighlighted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full animate-bounce">
                <Sparkles className="w-3 h-3 text-emerald-600" /> AI Applied
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <PrescriptionInputGroup
              label="POWER (SPH)"
              value={od.sph}
              onChange={(v) => onSetEye("od", "sph", v)}
              options={SPH_ALL}
              disabled={noRxFallback}
            />
            <PrescriptionInputGroup
              label="CYLINDER (CYL)"
              value={od.cyl}
              onChange={(v) => onSetEye("od", "cyl", v)}
              options={CYL_ALL}
              disabled={noRxFallback}
            />
          </div>
          <PrescriptionInputGroup
            label="AXIS"
            value={od.axis}
            onChange={(v) => onSetEye("od", "axis", v)}
            options={AXIS_OPTIONS}
            isAxis
            disabled={noRxFallback}
          />
        </div>

        {/* Left Eye (OS) */}
        <div
          className={cn(
            "p-5 rounded-2xl border transition-all duration-500 space-y-4",
            scanHighlighted
              ? "border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-50/40 shadow-md shadow-emerald-500/10"
              : "border-neutral-200/80 bg-neutral-50/30",
            noRxFallback && "opacity-50"
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Left Eye (OS)
              </span>
            </div>
            {scanHighlighted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full animate-bounce">
                <Sparkles className="w-3 h-3 text-emerald-600" /> AI Applied
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <PrescriptionInputGroup
              label="POWER (SPH)"
              value={os.sph}
              onChange={(v) => onSetEye("os", "sph", v)}
              options={SPH_ALL}
              disabled={noRxFallback}
            />
            <PrescriptionInputGroup
              label="CYLINDER (CYL)"
              value={os.cyl}
              onChange={(v) => onSetEye("os", "cyl", v)}
              options={CYL_ALL}
              disabled={noRxFallback}
            />
          </div>
          <PrescriptionInputGroup
            label="AXIS"
            value={os.axis}
            onChange={(v) => onSetEye("os", "axis", v)}
            options={AXIS_OPTIONS}
            isAxis
            disabled={noRxFallback}
          />
        </div>
      </div>

      {/* Conditional ADD Block for Progressive / All-in-One */}
      {isProgressive && (
        <div
          className={cn(
            "mt-6 p-5 rounded-2xl border-2 border-amber-400/40 bg-amber-50/30 space-y-4 transition-all duration-500",
            scanHighlighted && "border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-50/40"
          )}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Reading Number (ADD) — All-in-One Only
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleAddLinked}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer",
                addLinked
                  ? "bg-emerald-50 border-emerald-300/70 text-emerald-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {addLinked ? (
                <>
                  <Link2 className="w-3.5 h-3.5" /> Both Eyes Same
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5" /> Set Separately
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-amber-800/70 font-normal leading-relaxed">
            Reading addition (+0.75 to +3.50). Usually the same for both eyes. Toggle{" "}
            <strong>Set Separately</strong> to adjust each eye independently if needed.
          </p>
          <div className={cn("grid gap-4", addLinked ? "grid-cols-1 max-w-xs" : "grid-cols-1 sm:grid-cols-2")}>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                {addLinked ? "Reading Number (ADD)" : "Right Eye — Reading Number"}
              </label>
              <select
                value={noRxFallback ? "+1.50" : odAdd}
                onChange={(e) => onSetAdd("od", e.target.value)}
                disabled={noRxFallback}
                className={cn(
                  "w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none",
                  noRxFallback && "opacity-50"
                )}
              >
                {ADD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {!addLinked && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                  Left Eye — Reading Number
                </label>
                <select
                  value={noRxFallback ? "+1.50" : osAdd}
                  onChange={(e) => onSetAdd("os", e.target.value)}
                  disabled={noRxFallback}
                  className={cn(
                    "w-full bg-white border border-amber-300/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-neutral-900 text-sm font-bold font-mono transition-all outline-none",
                    noRxFallback && "opacity-50"
                  )}
                >
                  {ADD_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!addLinked && (
            <p className="text-[10px] text-amber-700 font-medium">
              Average reading addition: <strong>+{effectiveAdd.toFixed(2)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Step3Prescription;
