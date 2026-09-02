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
    <div className="space-y-5 animate-in fade-in duration-150">
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

      {/* ── Live Summary Card with Canonical Pricing Breakdown ── */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">
            Order Summary
          </p>
          {pricingResult && pricingResult.multiplier > 1 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              Rx Tier ({pricingResult.multiplier}x)
            </span>
          )}
        </div>

        {/* Frame thumbnail + name */}
        <div className="flex items-center gap-3">
          {frame.imageUrl && (
            <div className="w-12 h-10 rounded-lg bg-white border border-amber-200/80 overflow-hidden shrink-0 relative shadow-2xs">
              <Image
                src={frame.imageUrl}
                alt={frame.name}
                fill
                className="object-contain p-1"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{frame.name}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Rs. {frame.price.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-amber-200/60 pt-2.5 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium">Lens Tier</span>
            <span className="font-bold text-amber-800 text-right max-w-[200px] truncate">
              {selectedPackage?.code} — {selectedPackage?.name}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium">Vision Mode</span>
            <span className="font-bold text-slate-900 capitalize">{visionType}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-medium">Lens Price (Pair)</span>
            <span className="font-bold text-slate-900">Rs. {lensPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-amber-200/80">
            <span className="text-sm font-bold text-slate-900">Total Price</span>
            <span className="text-amber-600 font-bold text-xl">
              Rs. {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={onCheckout}
          disabled={isCheckingOut || isScanning}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Proceed to Checkout</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Step4Prescription;
