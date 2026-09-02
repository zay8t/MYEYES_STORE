'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Camera,
  FolderUp,
  Sparkles,
  Eye,
  Trash2,
  Loader2,
  FileCheck2,
  FileText,
  AlertCircle,
  ChevronDown,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SPH_OPTIONS,
  CYL_OPTIONS,
  AXIS_OPTIONS,
  ADD_OPTIONS,
} from '@/lib/constants/prescription';
import { compressPrescriptionImage } from '@/lib/image-compression';
import type { TotalPricingResult } from '@/lib/pricingEngine';
import type { FrameDetails } from './LensConfiguratorModal';

export interface Step4PrescriptionProps {
  frame: FrameDetails;
  visionType: 'standard' | 'progressive';
  setVisionType: (v: 'standard' | 'progressive') => void;
  selectedPackage: any;
  lensPrice: number;
  totalPrice: number;
  pricingResult?: TotalPricingResult | null;
  prescriptionTab: 'upload' | 'manual';
  setPrescriptionTab: (t: 'upload' | 'manual') => void;
  uploadedFile: File | null;
  setUploadedFile: (f: File | null) => void;
  uploadedPreviewUrl: string | null;
  setUploadedPreviewUrl: (u: string | null) => void;
  rxFileUrl: string | null;
  setRxFileUrl: (u: string | null) => void;
  isScanning: boolean;
  scanStatus: { type: 'success' | 'error' | 'idle'; message?: string };
  scanPrescriptionSlip: (file: File) => Promise<void>;
  uploadStorageFile: (file: File) => Promise<void>;
  odSph: string;
  setOdSph: (v: string) => void;
  odCyl: string;
  setOdCyl: (v: string) => void;
  odAxis: string;
  setOdAxis: (v: string) => void;
  osSph: string;
  setOsSph: (v: string) => void;
  osCyl: string;
  setOsCyl: (v: string) => void;
  osAxis: string;
  setOsAxis: (v: string) => void;
  addPower: string;
  setAddPower: (v: string) => void;
  openPicker: (config: {
    field: 'odSph' | 'odCyl' | 'odAxis' | 'osSph' | 'osCyl' | 'osAxis' | 'add';
    title: string;
    subtitle?: string;
    options: string[];
    value: string;
    unit?: string;
  }) => void;
  onBack: () => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
}

export function Step4Prescription({
  frame,
  visionType,
  setVisionType,
  selectedPackage,
  lensPrice,
  totalPrice,
  pricingResult,
  prescriptionTab,
  setPrescriptionTab,
  uploadedFile,
  setUploadedFile,
  uploadedPreviewUrl,
  setUploadedPreviewUrl,
  rxFileUrl,
  setRxFileUrl,
  isScanning,
  scanStatus,
  scanPrescriptionSlip,
  uploadStorageFile,
  odSph,
  setOdSph,
  odCyl,
  setOdCyl,
  odAxis,
  setOdAxis,
  osSph,
  setOsSph,
  osCyl,
  setOsCyl,
  osAxis,
  setOsAxis,
  addPower,
  setAddPower,
  openPicker,
  onBack,
  onCheckout,
  isCheckingOut,
}: Step4PrescriptionProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const isProgressive = visionType === 'progressive';
  const isPdf = uploadedFile?.type === 'application/pdf';

  // ─── File Pre-check & Handler with Client-Side Canvas Compression ───────

  const handleFile = useCallback(
    async (rawFile: File) => {
      setFileError(null);

      // Pre-check size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (rawFile.size > MAX_SIZE) {
        setFileError('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
      }

      // Pre-check type
      const isImg = rawFile.type.startsWith('image/');
      const isDoc = rawFile.type === 'application/pdf';
      if (!isImg && !isDoc) {
        setFileError('Please upload an image (JPG, PNG, WEBP) or a PDF document.');
        return;
      }

      // Client-side canvas compression for images (clamps max dim to 1600px, 0.82 JPEG quality)
      const processedFile = isImg ? await compressPrescriptionImage(rawFile) : rawFile;

      setUploadedFile(processedFile);
      const url = URL.createObjectURL(processedFile);
      setUploadedPreviewUrl(url);
      setRxFileUrl(null);

      // Trigger AI Scanner & storage upload
      scanPrescriptionSlip(processedFile);
      uploadStorageFile(processedFile);
    },
    [setUploadedFile, setUploadedPreviewUrl, setRxFileUrl, scanPrescriptionSlip, uploadStorageFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearUploadedSlip = () => {
    setUploadedFile(null);
    setUploadedPreviewUrl(null);
    setRxFileUrl(null);
    setFileError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900">Prescription Details</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Snap a photo of your doctor slip for instant AI reading or enter numbers manually.
        </p>
      </div>

      {/* Tab Switch */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setPrescriptionTab('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            prescriptionTab === 'upload'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          AI Slip Scan
        </button>
        <button
          type="button"
          onClick={() => setPrescriptionTab('manual')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            prescriptionTab === 'manual'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          Manual Entry
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          AI SLIP SCAN TAB (Dual Mobile Capture)
      ═══════════════════════════════════════════════ */}
      {prescriptionTab === 'upload' && (
        <div className="space-y-4">
          {uploadedPreviewUrl ? (
            /* Uploaded Preview + AI Scanning State */
            <div className="relative rounded-2xl border border-amber-300 bg-amber-50/30 overflow-hidden shadow-xs">
              {/* Media Preview Viewport */}
              <div className="relative w-full min-h-[180px] sm:min-h-[220px] bg-slate-50 flex items-center justify-center">
                {isPdf ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 max-w-[240px] truncate">
                      {uploadedFile?.name}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      PDF Document • {(uploadedFile?.size ? uploadedFile.size / 1024 : 0).toFixed(0)} KB
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={uploadedPreviewUrl}
                      alt="Prescription slip preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}

                {/* AI Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2.5 p-4 animate-in fade-in">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-amber-300">Analyzing slip with AI...</p>
                    <p className="text-xs text-slate-300 text-center max-w-[260px]">
                      Extracting SPH, CYL, AXIS &amp; ADD
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Slip Actions & Status */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-amber-200/60 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[260px]">
                    {uploadedFile?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="Re-snap photo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Change</span>
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

              {/* Status Banner */}
              {scanStatus.type === 'success' && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-t border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{scanStatus.message}</span>
                </div>
              )}

              {scanStatus.type === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/70 border-t border-amber-300 text-amber-900 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{scanStatus.message}</span>
                </div>
              )}
            </div>
          ) : (
            /* Dual Mobile Action Tiles (Camera + Gallery) */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'rounded-2xl transition-all',
                isDragging && 'ring-2 ring-amber-500 bg-amber-50/50'
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tile 1: Direct Camera Snap */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-white border-2 border-amber-200 hover:border-amber-400 active:bg-amber-50/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                      Take Photo
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Snap doctor slip directly with camera
                    </p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold mt-1">
                    Instant Camera
                  </span>
                </button>

                {/* Tile 2: Upload from Gallery / Files */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="bg-white border-2 border-amber-200 hover:border-amber-400 active:bg-amber-50/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FolderUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                      Upload Media
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select photo or PDF from device
                    </p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold mt-1">
                    JPG, PNG, PDF (Up to 10MB)
                  </span>
                </button>
              </div>

              {/* Hidden Inputs with Value Reset */}
              <input
                ref={cameraInputRef}
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) handleFile(file);
                }}
              />
              <input
                ref={galleryInputRef}
                id="gallery-input"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {fileError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {fileError}
            </p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          COMPACT 3-COLUMN TOUCH TILE GRID (OD / OS / ADD)
      ═══════════════════════════════════════════════ */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {prescriptionTab === 'upload' ? 'Verify Prescription Numbers' : 'Prescription Values'}
          </span>
          {isProgressive && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Progressive Active
            </span>
          )}
        </div>

        {/* Right Eye (OD) */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              OD (Right Eye)
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Touch tile to select</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* SPH */}
            <button
              type="button"
              onClick={() =>
                openPicker({
                  field: 'odSph',
                  title: 'Right Eye (OD) — Sphere (SPH)',
                  subtitle: 'Select optical sphere power (-16.00 to +16.00)',
                  options: SPH_OPTIONS,
                  value: odSph,
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                SPH
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {odSph}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>

            {/* CYL */}
            <button
              type="button"
              onClick={() =>
                openPicker({
                  field: 'odCyl',
                  title: 'Right Eye (OD) — Cylinder (CYL)',
                  subtitle: 'Select astigmatism cylinder (-4.00 to +4.00)',
                  options: CYL_OPTIONS,
                  value: odCyl,
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CYL
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {odCyl}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>

            {/* AXIS */}
            <button
              type="button"
              disabled={odCyl === '0.00'}
              onClick={() =>
                openPicker({
                  field: 'odAxis',
                  title: 'Right Eye (OD) — Axis',
                  subtitle: 'Select cylinder axis angle (1° to 180°)',
                  options: AXIS_OPTIONS,
                  value: odAxis,
                  unit: '°',
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                AXIS
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {odCyl === '0.00' ? '—' : `${odAxis}°`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Left Eye (OS) */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              OS (Left Eye)
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Touch tile to select</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* SPH */}
            <button
              type="button"
              onClick={() =>
                openPicker({
                  field: 'osSph',
                  title: 'Left Eye (OS) — Sphere (SPH)',
                  subtitle: 'Select optical sphere power (-16.00 to +16.00)',
                  options: SPH_OPTIONS,
                  value: osSph,
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                SPH
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {osSph}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>

            {/* CYL */}
            <button
              type="button"
              onClick={() =>
                openPicker({
                  field: 'osCyl',
                  title: 'Left Eye (OS) — Cylinder (CYL)',
                  subtitle: 'Select astigmatism cylinder (-4.00 to +4.00)',
                  options: CYL_OPTIONS,
                  value: osCyl,
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CYL
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {osCyl}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>

            {/* AXIS */}
            <button
              type="button"
              disabled={osCyl === '0.00'}
              onClick={() =>
                openPicker({
                  field: 'osAxis',
                  title: 'Left Eye (OS) — Axis',
                  subtitle: 'Select cylinder axis angle (1° to 180°)',
                  options: AXIS_OPTIONS,
                  value: osAxis,
                  unit: '°',
                })
              }
              className="bg-white border border-slate-200 hover:border-amber-400 active:border-amber-500 active:ring-2 active:ring-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl p-3 flex flex-col items-start cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                AXIS
              </span>
              <div className="flex items-center justify-between w-full mt-1">
                <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {osCyl === '0.00' ? '—' : `${osAxis}°`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Progressive ADD Power Tile */}
        {isProgressive && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-950">ADD Power (Reading Addition)</p>
              <span className="text-[10px] text-amber-800 font-semibold">Near &amp; Far</span>
            </div>
            <button
              type="button"
              onClick={() =>
                openPicker({
                  field: 'add',
                  title: 'Reading Addition (ADD Power)',
                  subtitle: 'Select near vision magnification (+0.75 to +3.50)',
                  options: ADD_OPTIONS,
                  value: addPower,
                })
              }
              className="bg-white border border-amber-300 hover:border-amber-500 active:ring-2 active:ring-amber-500/20 rounded-xl p-3.5 flex items-center justify-between cursor-pointer w-full text-left transition-all shadow-2xs"
            >
              <span className="text-sm font-mono font-bold text-slate-900">{addPower}</span>
              <ChevronDown className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          EXACT "STEP 4 — YOUR FINAL LENS PRICE" CARD (MATCHING LENS PRICING PAGE)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 rounded-2xl border border-amber-200/80 p-5 sm:p-6 space-y-4 shadow-sm text-neutral-900">
        
        {/* Card Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/30 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                Step 4 — Your Final Lens Price
              </h4>
              <p className="text-[11px] text-neutral-500 font-normal">
                Exact cost for your frame + lenses based on optical lab rates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Price Guaranteed
          </div>
        </div>

        {/* Itemized Breakdown */}
        <div className="space-y-2.5 text-sm pt-1">
          {/* Frame Item Row */}
          <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
            <div className="flex items-center gap-2.5 min-w-0">
              {frame.imageUrl && (
                <div className="w-9 h-7 rounded-md bg-white border border-neutral-200 overflow-hidden shrink-0 relative">
                  <Image src={frame.imageUrl} alt={frame.name} fill className="object-contain p-0.5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-semibold text-neutral-800 text-xs sm:text-sm truncate block">
                  {frame.name}
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">Selected Frame</span>
              </div>
            </div>
            <span className="font-mono font-bold text-neutral-800 text-xs sm:text-sm whitespace-nowrap">
              Rs. {frame.price.toLocaleString()}/-
            </span>
          </div>

          {/* Lens Package Row */}
          <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
            <div className="min-w-0">
              <span className="font-semibold text-neutral-800 text-xs sm:text-sm block truncate">
                {selectedPackage?.cleanName || selectedPackage?.name}
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                ({selectedPackage?.coating || selectedPackage?.badge})
              </span>
            </div>
            <span className="text-xs text-neutral-500 font-bold bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
              Pair of Lenses
            </span>
          </div>

          {/* Vision Mode Line */}
          {isProgressive ? (
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed flex-wrap gap-1">
              <div>
                <span className="font-semibold text-neutral-800 text-xs sm:text-sm">
                  PROGRESSIVE (TWO IN 1 NEAR AND FAR)
                </span>
                <span className="text-[11px] text-amber-700 ml-2 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                  Reading {addPower}
                </span>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 shrink-0">
                Far + Near Included (Base Rs. {selectedPackage?.presbyopiaBasePrice?.toLocaleString()})
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 border-dashed">
              <span className="font-semibold text-neutral-800 text-xs sm:text-sm">
                STANDARD VISION LENS (EVERYDAY SINGLE WEAR)
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 shrink-0">
                Base Rs. {selectedPackage?.standardBasePrice?.toLocaleString()}
              </span>
            </div>
          )}

          {/* Asymmetrical Customized Power Lines */}
          {pricingResult?.isAsymmetricRx && (
            <>
              <div className="flex justify-between items-center py-1 text-xs">
                <span className="font-medium text-neutral-600">Right Lens — customized power</span>
                <span className="font-mono font-bold text-neutral-800">
                  Rs. {Math.round(pricingResult.rightEyeLensPrice ?? 0).toLocaleString()}/-
                </span>
              </div>
              <div className="flex justify-between items-center py-1 text-xs border-b border-neutral-100 border-dashed">
                <span className="font-medium text-neutral-600">Left Lens — customized power</span>
                <span className="font-mono font-bold text-neutral-800">
                  Rs. {Math.round(pricingResult.leftEyeLensPrice ?? 0).toLocaleString()}/-
                </span>
              </div>
            </>
          )}
          {pricingResult && !pricingResult.isAsymmetricRx && (
            <p className="text-[11px] text-neutral-400 font-medium">Both left and right lenses included</p>
          )}
        </div>

        {/* Grand Total & Advance Notice */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-3 border-t border-neutral-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
              Total Order Price (Frame + Lenses)
            </span>
            <span className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
              Rs. {Math.round(totalPrice).toLocaleString()}/-
            </span>
            <span className="text-[11px] text-neutral-400 block mt-1 font-normal">
              Lens: Rs. {Math.round(lensPrice).toLocaleString()} + Frame: Rs. {frame.price.toLocaleString()}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-3 py-1.5 rounded-xl inline-block">
              {isProgressive ? '40% advance for Cash on Delivery' : '25% advance for Cash on Delivery'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation & Checkout Actions ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={isCheckingOut || isScanning}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 text-sm"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Checkout...</span>
              </>
            ) : (
              <>
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-center text-neutral-400 font-normal">
          Saves your lens settings for your frame
        </p>
      </div>
    </div>
  );
}

export default Step4Prescription;
