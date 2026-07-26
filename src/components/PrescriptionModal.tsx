"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Check, ChevronRight, Upload, ArrowLeft, Camera, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import {
  SOLEX_LENS_OPTIONS,
  calculateSolexLensPrice,
  SolexLensOption,
} from "@/lib/solex-lens-pricing";

export interface PrescriptionDetails {
  lensUsage: string;
  lensUsagePrice: number;
  lensMaterial: string;
  lensMaterialPrice: number;
  odSph: number;
  odCyl: number | null;
  odAxis: number | null;
  osSph: number;
  osCyl: number | null;
  osAxis: number | null;
  pd: number;
  add?: number | null;
  rxFileUrl?: string;
  notes?: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  onSubmit: (details: PrescriptionDetails, totalPrice: number) => void;
}

export default function PrescriptionModal({
  isOpen,
  onClose,
  productName,
  productPrice,
  onSubmit,
}: PrescriptionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected SOLEX Lens Type
  const [selectedLensId, setSelectedLensId] = useState<string>("sv-156-hmc");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "single_vision" | "bifocal" | "progressive">("all");

  // Prescription Values
  const [uploadMode, setUploadMode] = useState<"manual" | "upload">("manual");
  const [rxFile, setRxFile] = useState<File | null>(null);
  const [rxPreview, setRxPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [rx, setRx] = useState({
    odSph: "0.00",
    odCyl: "0.00",
    odAxis: "",
    osSph: "0.00",
    osCyl: "0.00",
    osAxis: "",
    pd: "63",
    add: "+1.50",
    rxFileUrl: "",
    notes: "",
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setRxFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setRxPreview(dataUrl);
      setRx((prev) => ({ ...prev, rxFileUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setRxFile(null);
    setRxPreview("");
    setRx((prev) => ({ ...prev, rxFileUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Calculate maximum SPH and CYL across both eyes for exact matrix lookup
  const parsedOdSph = parseFloat(rx.odSph) || 0;
  const parsedOdCyl = parseFloat(rx.odCyl) || 0;
  const parsedOsSph = parseFloat(rx.osSph) || 0;
  const parsedOsCyl = parseFloat(rx.osCyl) || 0;
  const parsedAdd = parseFloat(rx.add) || 0;

  // We use the eye with stronger prescription to calculate precise lab pricing
  const maxSph = Math.abs(parsedOdSph) > Math.abs(parsedOsSph) ? parsedOdSph : parsedOsSph;
  const maxCyl = Math.abs(parsedOdCyl) > Math.abs(parsedOsCyl) ? parsedOdCyl : parsedOsCyl;

  const [lensOptions, setLensOptions] = useState<SolexLensOption[]>(SOLEX_LENS_OPTIONS);

  useEffect(() => {
    async function loadLensOptions() {
      try {
        const res = await fetch("/api/admin/lens-prices");
        if (res.ok) {
          const data = await res.json();
          setLensOptions(data);
        }
      } catch (error) {
        console.error("Failed to load lens options:", error);
      }
    }
    loadLensOptions();
  }, []);

  const currentLensObj = useMemo(() => {
    return lensOptions.find((l) => l.id === selectedLensId) || lensOptions[0] || SOLEX_LENS_OPTIONS[1];
  }, [lensOptions, selectedLensId]);

  // Exact calculated lens price from SOLEX HD matrix
  const exactCalculatedLensPrice = useMemo(() => {
    return calculateSolexLensPrice(selectedLensId, maxSph, maxCyl, parsedAdd, currentLensObj?.basePrice);
  }, [selectedLensId, maxSph, maxCyl, parsedAdd, currentLensObj]);

  const totalPrice = productPrice + exactCalculatedLensPrice;

  if (!isOpen) return null;

  const filteredLenses = lensOptions.filter((l) => {
    if (categoryFilter === "all") return true;
    return l.category === categoryFilter;
  });

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setStep(3);
  };

  const handleFinalSubmit = () => {
    onSubmit(
      {
        lensUsage: currentLensObj.name,
        lensUsagePrice: exactCalculatedLensPrice,
        lensMaterial: `${currentLensObj.index} Index (${currentLensObj.coating})`,
        lensMaterialPrice: 0,
        odSph: parsedOdSph,
        odCyl: parsedOdCyl || null,
        odAxis: rx.odAxis ? parseInt(rx.odAxis, 10) : null,
        osSph: parsedOsSph,
        osCyl: parsedOsCyl || null,
        osAxis: rx.osAxis ? parseInt(rx.osAxis, 10) : null,
        pd: parseFloat(rx.pd) || 63,
        add: parsedAdd || null,
        rxFileUrl: rx.rxFileUrl,
        notes: rx.notes,
      },
      totalPrice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="My Eyes Logo" width={16} height={16} className="object-contain" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                MY EYES CONFIGURATOR
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-tight mt-1.5">
              {productName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", step === 1 ? "bg-brand text-white" : "bg-slate-200 text-slate-700")}>1</span>
            <span className={step === 1 ? "text-slate-900 font-semibold" : ""}>Prescription</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", step === 2 ? "bg-brand text-white" : "bg-slate-200 text-slate-700")}>2</span>
            <span className={step === 2 ? "text-slate-900 font-semibold" : ""}>Lens Type</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", step === 3 ? "bg-brand text-white" : "bg-slate-200 text-slate-700")}>3</span>
            <span className={step === 3 ? "text-slate-900 font-semibold" : ""}>Review & Bag</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: ENTER PRESCRIPTION VALUES */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Step 1 Header */}
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">Step 1: Provide Your Prescription</h4>
                <p className="text-xs text-slate-500">Choose how you&apos;d like to share your prescription details</p>
              </div>

              {/* Two prominent option cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMode("manual")}
                  className={cn(
                    "rounded-xl border-2 p-5 text-left transition-all duration-200 cursor-pointer flex flex-col gap-3",
                    uploadMode === "manual"
                      ? "border-brand bg-brand/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    uploadMode === "manual" ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Enter Manually</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed">Type your SPH, CYL, Axis &amp; PD values from your optometrist report.</span>
                  </div>
                  {uploadMode === "manual" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUploadMode("upload")}
                  className={cn(
                    "rounded-xl border-2 p-5 text-left transition-all duration-200 cursor-pointer flex flex-col gap-3",
                    uploadMode === "upload"
                      ? "border-brand bg-brand/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    uploadMode === "upload" ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Upload Rx Prescription</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed">Upload a photo or scan of your prescription. We&apos;ll handle the rest.</span>
                  </div>
                  {uploadMode === "upload" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </button>
              </div>

              {/* Conditional content based on selection */}
              {uploadMode === "manual" ? (
                <form onSubmit={handleNextFromStep1} className="space-y-4">
                  {/* Right Eye (OD) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Right Eye (OD)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">SPH (Sphere)</label>
                        <input
                          type="number"
                          step="0.25"
                          required
                          value={rx.odSph}
                          onChange={(e) => setRx({ ...rx, odSph: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">CYL (Cylinder)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rx.odCyl}
                          onChange={(e) => setRx({ ...rx, odCyl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">AXIS (1-180°)</label>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={rx.odAxis}
                          onChange={(e) => setRx({ ...rx, odAxis: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="90"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Eye (OS) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Left Eye (OS)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">SPH (Sphere)</label>
                        <input
                          type="number"
                          step="0.25"
                          required
                          value={rx.osSph}
                          onChange={(e) => setRx({ ...rx, osSph: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">CYL (Cylinder)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rx.osCyl}
                          onChange={(e) => setRx({ ...rx, osCyl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">AXIS (1-180°)</label>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={rx.osAxis}
                          onChange={(e) => setRx({ ...rx, osAxis: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white min-h-[44px]"
                          placeholder="90"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PD & ADD */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pupillary Distance (PD mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={rx.pd}
                        onChange={(e) => setRx({ ...rx, pd: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:border-brand focus:outline-none bg-white"
                        placeholder="63"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Near Addition (ADD for Bifocal/Progressive)
                      </label>
                      <input
                        type="text"
                        value={rx.add}
                        onChange={(e) => setRx({ ...rx, add: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:border-brand focus:outline-none bg-white"
                        placeholder="+1.50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    Continue to Lens Selection
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {/* Upload area */}
                  {!rxPreview ? (
                    <div className="border-2 border-dashed border-brand/40 bg-brand/5 rounded-xl p-8 text-center hover:border-brand transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-brand/10 text-brand mx-auto mb-3 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Upload Your Prescription</p>
                      <p className="text-[11px] text-slate-500 mb-4">Upload a photo of your prescription report (PNG or JPG)</p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-colors cursor-pointer shadow-sm"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Choose from Gallery
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-sm"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          Prescription uploaded
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rxPreview}
                        alt="Prescription preview"
                        className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white"
                      />
                      <p className="text-[10px] text-slate-500 text-center">{rxFile?.name}</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor&apos;s Notes / Special Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={rx.notes}
                      onChange={(e) => setRx({ ...rx, notes: e.target.value })}
                      placeholder="e.g., Reading prism add +1.50, bifocal required, etc."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-brand focus:outline-none"
                    />
                  </div>

                  {/* Upload Info Note */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand/5 border border-brand/10">
                    <Image src="/logo.svg" alt="My Eyes" width={14} height={14} className="object-contain mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-slate-900">Our lab team will review</strong> your uploaded prescription and contact you on WhatsApp to confirm exact SPH, CYL, Axis &amp; PD before processing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!rxPreview}
                    className={cn(
                      "w-full py-3.5 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md",
                      rxPreview
                        ? "bg-brand hover:bg-brand-dark"
                        : "bg-slate-300 cursor-not-allowed"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Continue with Uploaded Rx
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT SOLEX HD LENS TYPE */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 mb-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Rx Values
              </button>

              <div className="flex items-center justify-between">
                <div>
                <h4 className="text-sm font-bold text-slate-900">Step 2: Select Premium Lens Type</h4>
                  <p className="text-xs text-slate-500">SOLEX HD Lab — National Ophthalmic Price Matrix</p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap", categoryFilter === "all" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  All Lenses
                </button>
                <button
                  onClick={() => setCategoryFilter("single_vision")}
                  className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap", categoryFilter === "single_vision" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Single Vision
                </button>
                <button
                  onClick={() => setCategoryFilter("bifocal")}
                  className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap", categoryFilter === "bifocal" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Bifocal
                </button>
                <button
                  onClick={() => setCategoryFilter("progressive")}
                  className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap", categoryFilter === "progressive" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Progressive
                </button>
              </div>

              {/* SOLEX Lens Options List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredLenses.map((lens) => {
                  const calcPrice = calculateSolexLensPrice(lens.id, maxSph, maxCyl, parsedAdd, lens.basePrice);
                  return (
                    <button
                      key={lens.id}
                      onClick={() => setSelectedLensId(lens.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between group cursor-pointer",
                        selectedLensId === lens.id
                          ? "border-brand bg-brand/5 ring-1 ring-brand"
                          : "border-slate-200 hover:border-slate-400 bg-white"
                      )}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            {lens.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {lens.index} Index
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {lens.description}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Coating: {lens.coating}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 block">
                          +Rs. {calcPrice}/-
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">SOLEX Lab Rate</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextFromStep2}
                className="w-full mt-4 py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                Review Summary & Calculated Pricing
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: REVIEW SUMMARY & PRICING */}
          {step === 3 && (
            <div className="space-y-5">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Lens Selection
              </button>

              <div>
                <h4 className="text-sm font-bold text-slate-900">Step 3: Review Total Price Breakdown</h4>
                <p className="text-xs text-slate-500 mt-0.5">Frame base price + Exact calculated lens price</p>
              </div>

              {/* Exact Cost Calculation Breakdown Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                  <span className="text-slate-600 font-semibold">Eyewear Frame ({productName})</span>
                  <span className="font-extrabold text-slate-900">{formatPrice(productPrice)}</span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="text-slate-900 font-bold block">{currentLensObj.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Matrix Lookup: SPH {maxSph > 0 ? `+${maxSph}` : maxSph} | CYL {maxCyl > 0 ? `+${maxCyl}` : maxCyl}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900">+Rs. {exactCalculatedLensPrice}/-</span>
                </div>

                {uploadMode === "manual" && (
                  <div className="pt-1 text-[11px] text-slate-600 space-y-1 font-mono bg-white p-3 rounded-lg border border-slate-200/60">
                    <p className="font-sans font-bold text-slate-900 text-xs">Customer Optical Prescription:</p>
                    <p>OD (Right Eye): SPH {rx.odSph} | CYL {rx.odCyl || "0.00"} | AXIS {rx.odAxis || "-"}</p>
                    <p>OS (Left Eye) : SPH {rx.osSph} | CYL {rx.osCyl || "0.00"} | AXIS {rx.osAxis || "-"}</p>
                    <p>PD: {rx.pd} mm {rx.add ? `| Near ADD: ${rx.add}` : ""}</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-slate-900">Total Combined Price</span>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900 block">
                      {formatPrice(totalPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      (Frame {formatPrice(productPrice)} + Lens Rs.{exactCalculatedLensPrice}/-)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                Add to Bag with Premium Lenses ({formatPrice(totalPrice)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
