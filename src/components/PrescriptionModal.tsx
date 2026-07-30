"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X, Check, ChevronRight, ArrowLeft, Camera, ImageIcon,
  Trash2, User, Phone, Scan, Sparkles, AlertCircle, Loader2, Pencil
} from "lucide-react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { compressImage } from "@/lib/nativeStorage";
import {
  SOLEX_LENS_OPTIONS,
  CORE_FIVE_LENS_IDS,
  SolexLensOption,
} from "@/lib/solex-lens-pricing";
import { calculateTotalLensPrice, BasePriceConfig, DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";
import {
  preprocessPrescriptionImage,
  parseOpticalPrescription,
  ExtractedPrescription,
} from "@/lib/ocrScanner";

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
  lensBasePriceKey?: string;
  lensBasePriceValue?: number;
  lensMultiplier?: number;
  lensFinalPrice?: number;
  framePrice?: number;
  isAsymmetricRx?: boolean;
  rightEyeLensPrice?: number;
  leftEyeLensPrice?: number;
  rightMultiplier?: number;
  leftMultiplier?: number;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  productId?: string;
  onSubmit: (details: PrescriptionDetails, totalPrice: number) => void;
}

// Consumer-friendly display names & luxury badges for the 5 Core Options
const CORE_CONSUMER_META: Record<string, { badge: string }> = {
  "progressive-freeform":     { badge: "+40 Progressive" },
  "sv-156-bluecut":          { badge: "Digital Shield" },
  "sv-156-photogrey":        { badge: "Smart Tint" },
  "sv-156-photogrey-bluecut":{ badge: "Dual Shield" },
  "sv-167-shmc":             { badge: "1.67 High Index" },
};

function formatSignedNotation(val: string | number): string {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num) || num === 0) return "+0.00";
  return num > 0 ? `+${num.toFixed(2)}` : `-${Math.abs(num).toFixed(2)}`;
}

interface SignedPowerInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isAxis?: boolean;
  placeholder?: string;
  isAiExtracted?: boolean;
}

function SignedPowerInput({ label, value, onChange, isAxis = false, placeholder = "0.00", isAiExtracted = false }: SignedPowerInputProps) {
  if (isAxis) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</label>
          {isAiExtracted && <span className="px-1 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded uppercase">AI</span>}
        </div>
        <input
          type="number"
          step="1"
          min="0"
          max="180"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold text-center focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white min-h-[42px]"
        />
      </div>
    );
  }

  const numVal = parseFloat(value) || 0;
  const isNegative = value.startsWith("-") || (numVal < 0);

  const toggleSign = () => {
    const abs = Math.abs(numVal);
    if (isNegative) {
      onChange(`+${(abs === 0 ? 0.0 : abs).toFixed(2)}`);
    } else {
      onChange(`-${(abs === 0 ? 0.25 : abs).toFixed(2)}`);
    }
  };

  const adjustValue = (delta: number) => {
    const newVal = numVal + delta;
    onChange(formatSignedNotation(newVal));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</label>
        {isAiExtracted && <span className="px-1 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded uppercase">AI</span>}
      </div>

      <div className="space-y-1">
        {/* Main Input + Sign Toggle */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={toggleSign}
            title="Click to toggle + / - sign"
            className={cn(
              "absolute left-1 z-10 px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs select-none",
              isNegative
                ? "bg-rose-500 hover:bg-rose-600 text-white border border-rose-600"
                : "bg-amber-500 hover:bg-amber-600 text-white border border-amber-600"
            )}
          >
            {isNegative ? "-" : "+"}
          </button>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => {
              if (value && !isNaN(parseFloat(value))) {
                onChange(formatSignedNotation(value));
              }
            }}
            placeholder={placeholder}
            className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold text-center focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white min-h-[42px]"
          />
        </div>

        {/* Instant +/- 0.25 Numpad Steppers */}
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => adjustValue(-0.25)}
            className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
          >
            -0.25
          </button>
          <button
            type="button"
            onClick={() => adjustValue(0.25)}
            className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
          >
            +0.25
          </button>
        </div>
      </div>
    </div>
  );
}

function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done = current > n;
  const active = current === n;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all duration-200",
        done ? "bg-amber-500 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
      )}>
        {done ? <Check className="w-3 h-3" /> : n}
      </span>
      <span className={cn("text-[11px] font-semibold hidden sm:block whitespace-nowrap", active ? "text-slate-900" : "text-slate-400")}>
        {label}
      </span>
    </div>
  );
}

export default function PrescriptionModal({
  isOpen, onClose, productName, productPrice, productId, onSubmit,
}: PrescriptionModalProps) {
  // Step Sequence: 1 = Your Info, 2 = Choose Lenses, 3 = Prescription & Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Lead capture
  const [lead, setLead] = useState({ name: "", age: "", whatsapp: "" });
  const [leadSaving, setLeadSaving] = useState(false);
  const leadValid = lead.name.trim().length > 1 && Number(lead.age) > 0 && lead.whatsapp.replace(/\D/g, "").length >= 10;
  
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);
  const [basePricesLoaded, setBasePricesLoaded] = useState(false);

  useEffect(() => {
    async function fetchBasePrices() {
      try {
        const res = await fetch("/api/base-prices");
        if (res.ok) {
          const data = await res.json();
          setBasePrices(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBasePricesLoaded(true);
      }
    }
    fetchBasePrices();
  }, []);

  // Step 2: Lens selection (Default to #1 Progressive or #2 Blue Cut)
  const [selectedLensId, setSelectedLensId] = useState<string>("progressive-freeform");
  const [lensOptions, setLensOptions] = useState<SolexLensOption[]>([]);

  // Step 3: Prescription

  const [uploadMode, setUploadMode] = useState<"upload" | "manual">("upload");
  const [, setRxFile] = useState<File | null>(null);
  const [rxPreview, setRxPreview] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrSanityOpen, setOcrSanityOpen] = useState(false);
  const [extractedValues, setExtractedValues] = useState<ExtractedPrescription | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [rx, setRx] = useState({
    odSph: "+0.00", odCyl: "+0.00", odAxis: "",
    osSph: "+0.00", osCyl: "+0.00", osAxis: "",
    pd: "63", add: "+1.50", rxFileUrl: "", notes: "",
  });

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLead({ name: "", age: "", whatsapp: "" });

      setUploadMode("upload");
      setRxFile(null);
      setRxPreview("");
      setOcrExtracted(false);
      setOcrError("");
      setOcrSanityOpen(false);
      setExtractedValues(null);
      setRx({ odSph: "+0.00", odCyl: "+0.00", odAxis: "", osSph: "+0.00", osCyl: "+0.00", osAxis: "", pd: "63", add: "+1.50", rxFileUrl: "", notes: "" });
      setSelectedLensId("progressive-freeform");
    }
  }, [isOpen]);

  // Load and strictly order the 5 Core Options for customer selection
  useEffect(() => {
    async function loadLensOptions() {
      try {
        const res = await fetch("/api/admin/lens-prices");
        if (res.ok) {
          const data: SolexLensOption[] = await res.json();
          // Filter to strictly the 5 Core Options in exact order
          const coreOrdered = CORE_FIVE_LENS_IDS.map(id => {
            const found = data.find(l => l.id === id);
            const staticMatch = SOLEX_LENS_OPTIONS.find(l => l.id === id);
            return found || staticMatch;
          }).filter((l): l is SolexLensOption => Boolean(l));

          if (coreOrdered.length > 0) {
            setLensOptions(coreOrdered);
            return;
          }
        }
      } catch { /* fallback to static */ }

      // Fallback to static 5 core options in exact order
      const staticCore = CORE_FIVE_LENS_IDS.map(id =>
        SOLEX_LENS_OPTIONS.find(l => l.id === id)
      ).filter((l): l is SolexLensOption => Boolean(l));
      setLensOptions(staticCore);
    }
    if (isOpen) loadLensOptions();
  }, [isOpen]);

  // Active customer lens list (defaults to static core if state loading)
  const activeCustomerLenses = useMemo(() => {
    if (lensOptions.length > 0) return lensOptions;
    return CORE_FIVE_LENS_IDS.map(id =>
      SOLEX_LENS_OPTIONS.find(l => l.id === id)
    ).filter((l): l is SolexLensOption => Boolean(l));
  }, [lensOptions]);


  // Pricing calculations
  const parsedOdSph = parseFloat(rx.odSph) || 0;
  const parsedOdCyl = parseFloat(rx.odCyl) || 0;
  const parsedOsSph = parseFloat(rx.osSph) || 0;
  const parsedOsCyl = parseFloat(rx.osCyl) || 0;

  const currentLensObj = useMemo(() =>
    activeCustomerLenses.find(l => l.id === selectedLensId) || activeCustomerLenses[0] || SOLEX_LENS_OPTIONS[0],
    [activeCustomerLenses, selectedLensId]
  );

  const pricingResult = useMemo(() => {
    if (!basePricesLoaded) return null;
    return calculateTotalLensPrice(
      selectedLensId, 
      { sph: parsedOdSph, cyl: parsedOdCyl }, 
      { sph: parsedOsSph, cyl: parsedOsCyl }, 
      basePrices
    );
  }, [selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, basePrices, basePricesLoaded]);

  const exactCalculatedLensPrice = pricingResult ? pricingResult.finalPrice : 0;
  const isOutOfRange = pricingResult === null && basePricesLoaded;

  const totalPrice = productPrice + exactCalculatedLensPrice;

  // File handlers
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setRxFile(file);
    setOcrExtracted(false);
    setOcrError("");
    compressImage(file, 900, 900, 0.7)
      .then(compressed => {
        setRxPreview(compressed);
        setRx(prev => ({ ...prev, rxFileUrl: compressed }));
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = e => {
          const url = e.target?.result as string;
          setRxPreview(url);
          setRx(prev => ({ ...prev, rxFileUrl: url }));
        };
        reader.readAsDataURL(file);
      });
  }, []);

  const handleRemoveFile = () => {
    setRxFile(null);
    setRxPreview("");
    setOcrExtracted(false);
    setOcrError("");
    setOcrSanityOpen(false);
    setExtractedValues(null);
    setRx(prev => ({ ...prev, rxFileUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // High-Precision Preprocessed OCR scan
  const handleOcrScan = useCallback(async () => {
    if (!rxPreview) return;
    setOcrScanning(true);
    setOcrError("");
    try {
      const sharpenedImage = await preprocessPrescriptionImage(rxPreview);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(sharpenedImage);
      await worker.terminate();

      const parsed = parseOpticalPrescription(text);

      if (parsed.odSph || parsed.osSph || parsed.odCyl || parsed.osCyl || parsed.pd || parsed.add) {
        setExtractedValues(parsed);
        setOcrSanityOpen(true);
      } else {
        setOcrError("Could not extract values cleanly. Please review or fill manually below.");
        setUploadMode("manual");
      }
    } catch (err) {
      console.error("OCR scan error:", err);
      setOcrError("OCR scan failed. Please enter values manually.");
      setUploadMode("manual");
    } finally {
      setOcrScanning(false);
    }
  }, [rxPreview]);

  // Apply OCR values from Sanity Check Modal
  const handleApplyExtractedValues = () => {
    if (extractedValues) {
      const updates: Partial<typeof rx> = {};
      if (extractedValues.odSph) updates.odSph = formatSignedNotation(extractedValues.odSph);
      if (extractedValues.osSph) updates.osSph = formatSignedNotation(extractedValues.osSph);
      if (extractedValues.odCyl) updates.odCyl = formatSignedNotation(extractedValues.odCyl);
      if (extractedValues.osCyl) updates.osCyl = formatSignedNotation(extractedValues.osCyl);
      if (extractedValues.odAxis) updates.odAxis = extractedValues.odAxis;
      if (extractedValues.osAxis) updates.osAxis = extractedValues.osAxis;
      if (extractedValues.pd) updates.pd = extractedValues.pd;

      setRx(prev => ({ ...prev, ...updates }));
      setOcrExtracted(true);
      setUploadMode("manual");
    }
    setOcrSanityOpen(false);
  };

  // Step 1 → submit lead & advance to Step 2 (Choose Lenses)
  const handleProceedFromStep1 = async () => {
    if (!leadValid) return;
    setLeadSaving(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lead.name, age: parseInt(lead.age), whatsapp: lead.whatsapp, frameId: productId }),
      });
    } catch { /* fire-and-forget */ }
    setLeadSaving(false);
    setStep(2);
  };

  // Final submit
  const handleFinalSubmit = () => {
    onSubmit({
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
      add: null,
      rxFileUrl: rx.rxFileUrl,
      notes: rx.notes,
      lensBasePriceKey: pricingResult?.basePriceKey,
      lensBasePriceValue: pricingResult?.basePriceValue,
      lensMultiplier: pricingResult?.multiplier,
      lensFinalPrice: pricingResult?.finalPrice,
      framePrice: productPrice,
      isAsymmetricRx: pricingResult?.isAsymmetricRx || false,
      rightEyeLensPrice: pricingResult?.rightEyeLensPrice,
      leftEyeLensPrice: pricingResult?.leftEyeLensPrice,
      rightMultiplier: pricingResult?.rightMultiplier,
      leftMultiplier: pricingResult?.leftMultiplier,
    }, totalPrice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[93vh] animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-200/60 p-1">
              <Image
                src="/logo.svg"
                alt="MY EYES Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wider text-amber-600 uppercase">
                  MY EYES
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  CONFIGURATOR
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-500 mt-0.5 leading-tight">{productName}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prominent Luxury Back Button in Header (visible on Steps 2 and 3) */}
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
                Back
              </button>
            )}

            <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar (1: Your Info -> 2: Choose Lenses -> 3: Prescription & Review) */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <StepDot n={1} current={step} label="Your Info" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          <StepDot n={2} current={step} label="Choose Lenses" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          <StepDot n={3} current={step} label="Prescription & Review" />
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* STEP 1: YOUR INFO (LEAD CAPTURE) */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Your Contact Details</h4>
                <p className="text-xs text-slate-500 mt-0.5">We&apos;ll send your order updates and prescription confirmation via WhatsApp.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={lead.name}
                      onChange={e => setLead({ ...lead, name: e.target.value })}
                      placeholder="e.g. Ahmed Khan"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age <span className="text-slate-400 font-normal">(Helps us tailor lens options)</span></label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={lead.age}
                    onChange={e => setLead({ ...lead, age: e.target.value })}
                    placeholder="e.g. 42"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +92
                    </div>
                    <input
                      type="tel"
                      value={lead.whatsapp}
                      onChange={e => setLead({ ...lead, whatsapp: e.target.value })}
                      placeholder="3xx-xxxxxxx"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedFromStep1}
                disabled={!leadValid || leadSaving}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer",
                  leadValid && !leadSaving
                    ? "bg-slate-900 hover:bg-black text-white shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {leadSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {leadSaving ? "Saving..." : "Proceed to Choose Lenses"}
                {!leadSaving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE LENSES (STRICTLY 5 CORE OPTIONS) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Select Frame Lens Package</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Select from our 5 core precision optical lens packages.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Info
                </button>
              </div>

              <div className="space-y-3">
                {activeCustomerLenses.map((lens, idx) => {
                  const isSelected = selectedLensId === lens.id;
                  const meta = CORE_CONSUMER_META[lens.id];

                  const lensPricingResult = calculateTotalLensPrice(
                    lens.id,
                    { sph: parsedOdSph, cyl: parsedOdCyl },
                    { sph: parsedOsSph, cyl: parsedOsCyl },
                    basePrices
                  );
                  const calcPrice = lensPricingResult ? lensPricingResult.finalPrice : 0;
                  const isLensOutOfRange = lensPricingResult === null && basePricesLoaded;

                  return (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() => setSelectedLensId(lens.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden",
                        isSelected
                          ? "border-amber-400 bg-amber-50/60 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5",
                            isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-900">{lens.name}</span>
                              {meta?.badge && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider",
                                  isSelected ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-600"
                                )}>
                                  {meta.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{lens.description}</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">{lens.index} Index · {lens.coating}</p>

                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {isLensOutOfRange ? (
                            <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded block mt-1">Out of Range</span>
                          ) : (
                            <span className="text-sm font-extrabold text-slate-900 block">+Rs. {calcPrice}/-</span>
                          )}
                          {isSelected && <Check className="w-4.5 h-4.5 text-amber-600 ml-auto mt-1" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Proceed to Prescription & Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: PRESCRIPTION & REVIEW */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Prescription & Order Review</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Upload card or use our signed keypad controls, then confirm your order.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Lenses
                </button>
              </div>


              {/* UPLOAD CARD / CAMERA SCANNER */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

              {!rxPreview ? (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-6 text-center transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 mx-auto mb-2 flex items-center justify-center">
                      <Scan className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 mb-0.5">Scan Prescription Card</p>
                    <p className="text-[10px] text-slate-500 mb-3">Upload photo or card — AI contrast sharpening auto-extracts your powers</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer shadow-xs">
                        <ImageIcon className="w-3.5 h-3.5" /> Gallery
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                        <Camera className="w-3.5 h-3.5" /> Take Photo
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT LUXURY MANUAL ENTRY BUTTON */}
                  {uploadMode !== "manual" && (
                    <button
                      type="button"
                      onClick={() => setUploadMode("manual")}
                      className="w-full p-3.5 rounded-2xl border-2 border-amber-400/80 bg-amber-50/60 hover:bg-amber-100/60 text-amber-950 font-extrabold text-sm flex items-center justify-between transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Pencil className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                          <p className="font-extrabold text-slate-900 text-xs">Enter Prescription Manually</p>
                          <p className="text-[10px] text-amber-800 font-medium">Use signed +/- keypad controls for effortless entry</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                        + / - Keypad
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Prescription image uploaded
                    </span>
                    <button type="button" onClick={handleRemoveFile}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <img src={rxPreview} alt="Prescription" className="w-full max-h-36 object-contain rounded-xl border border-slate-200 bg-white" />

                  {!ocrExtracted && !ocrScanning && (
                    <button onClick={handleOcrScan}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                      <Scan className="w-4 h-4" /> High-Precision AI Prescription Scanner
                    </button>
                  )}
                  {ocrScanning && (
                    <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-amber-700 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Sharpening image & extracting parameters...
                    </div>
                  )}
                  {ocrExtracted && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5" /> Parameters extracted! Review below.
                    </div>
                  )}
                  {ocrError && (
                    <div className="flex items-center gap-2 text-xs text-red-700 font-semibold bg-red-50 border border-red-200/60 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5" /> {ocrError}
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL PRESCRIPTION ENTRY WITH SIGNED KEYPAD CONTROLS */}
              {uploadMode === "manual" && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-amber-600" /> Manual Signed Keypad Input
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadMode("upload")}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Hide manual entry
                    </button>
                  </div>

                  {/* Right Eye (OD) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block text-amber-800">
                      Right Eye (OD)
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <SignedPowerInput
                        label="SPH"
                        value={rx.odSph}
                        onChange={val => setRx(prev => ({ ...prev, odSph: val }))}
                        isAiExtracted={ocrExtracted}
                      />
                      <SignedPowerInput
                        label="CYL"
                        value={rx.odCyl}
                        onChange={val => setRx(prev => ({ ...prev, odCyl: val }))}
                        isAiExtracted={ocrExtracted}
                      />
                      <SignedPowerInput
                        label="AXIS"
                        value={rx.odAxis}
                        onChange={val => setRx(prev => ({ ...prev, odAxis: val }))}
                        isAxis
                        placeholder="90"
                        isAiExtracted={ocrExtracted}
                      />
                    </div>
                  </div>

                  {/* Left Eye (OS) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block text-amber-800">
                      Left Eye (OS)
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <SignedPowerInput
                        label="SPH"
                        value={rx.osSph}
                        onChange={val => setRx(prev => ({ ...prev, osSph: val }))}
                        isAiExtracted={ocrExtracted}
                      />
                      <SignedPowerInput
                        label="CYL"
                        value={rx.osCyl}
                        onChange={val => setRx(prev => ({ ...prev, osCyl: val }))}
                        isAiExtracted={ocrExtracted}
                      />
                      <SignedPowerInput
                        label="AXIS"
                        value={rx.osAxis}
                        onChange={val => setRx(prev => ({ ...prev, osAxis: val }))}
                        isAxis
                        placeholder="90"
                        isAiExtracted={ocrExtracted}
                      />
                    </div>
                  </div>

                  {/* PD */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">PD (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={rx.pd}
                        onChange={e => setRx(prev => ({ ...prev, pd: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold text-center focus:ring-2 focus:ring-amber-400 bg-white"
                        placeholder="63"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Special Instructions <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                    <textarea rows={2} value={rx.notes} onChange={e => setRx({ ...rx, notes: e.target.value })}
                      placeholder="e.g. Reading distance focus, progressive customization..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white resize-none" />
                  </div>
                </div>
              )}

              {/* Price & Order Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Price & Order Summary</p>
                
                {/* 1. Frame Base */}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Frame — {productName}</span>
                  <span className="font-bold text-slate-900">{formatPrice(productPrice)}</span>
                </div>
                
                {/* 2 & 3. Lens Choice & Prescription Power Add-on */}
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <div>
                    <span className="block font-semibold text-slate-900">
                      {currentLensObj?.name} {pricingResult?.basePriceKey ? `(${pricingResult.basePriceKey})` : ""}
                    </span>
                    {!isOutOfRange && pricingResult && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Base Price: {formatPrice(pricingResult.basePriceValue)} 
                        {!pricingResult.isAsymmetricRx && ` × ${pricingResult.multiplier.toFixed(2)}x`}
                      </span>
                    )}
                  </div>
                  {isOutOfRange ? (
                    <span className="px-2 py-1 text-[10px] font-extrabold uppercase text-red-700 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                      Custom RX Required — Contact Support
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">+Rs. {exactCalculatedLensPrice}/-</span>
                  )}
                </div>

                {/* 4. Per-Eye Breakdown (If Asymmetric) */}
                {!isOutOfRange && pricingResult?.isAsymmetricRx && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/50 border border-amber-200/50 rounded-xl p-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Right Eye (OD) Multiplier: {pricingResult.rightMultiplier?.toFixed(2)}x</span>
                      <span className="font-bold">Rs. {pricingResult.rightEyeLensPrice}/-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Left Eye (OS) Multiplier: {pricingResult.leftMultiplier?.toFixed(2)}x</span>
                      <span className="font-bold">Rs. {pricingResult.leftEyeLensPrice}/-</span>
                    </div>
                    <div className="text-[9px] text-slate-500 text-center border-t border-amber-200/40 pt-1 mt-1 font-semibold">
                      OD Price: Rs. {pricingResult.rightEyeLensPrice} | OS Price: Rs. {pricingResult.leftEyeLensPrice}
                    </div>
                  </div>
                )}

                {uploadMode === "manual" && (
                  <div className="text-[10px] font-mono text-slate-600 bg-white rounded-xl border border-slate-200 p-2.5 space-y-0.5">
                    <p>OD: SPH {rx.odSph || "0.00"} CYL {rx.odCyl || "+0.00"} AXIS {rx.odAxis || "—"}</p>
                    <p>OS: SPH {rx.osSph || "0.00"} CYL {rx.osCyl || "+0.00"} AXIS {rx.osAxis || "—"}</p>
                    <p>PD: {rx.pd}mm</p>
                  </div>
                )}

                {/* 5. Live Total */}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900">Total</span>
                  <span className="text-base font-extrabold text-slate-900">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {isOutOfRange && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Custom RX Power — Lens Not Available for Standard Checkout. Please contact WhatsApp Support.</p>
                </div>
              )}

              {/* Add to Bag Button */}
              <button
                onClick={handleFinalSubmit}
                disabled={isOutOfRange}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm",
                  isOutOfRange ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                )}
              >
                <Check className="w-4.5 h-4.5" />
                Add to Bag — {formatPrice(totalPrice)}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* OCR SANITY CHECK VERIFICATION MODAL */}
      {ocrSanityOpen && extractedValues && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Verify AI Extracted Values</h3>
              </div>
              <button onClick={() => setOcrSanityOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Our high-precision optical scanner recognized the following values from your prescription card. Please confirm before applying.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Right Eye (OD)</span>
                <p>SPH: <strong className="text-amber-700">{formatSignedNotation(extractedValues.odSph || 0)}</strong></p>
                <p>CYL: <strong className="text-amber-700">{formatSignedNotation(extractedValues.odCyl || 0)}</strong></p>
                <p>AXIS: <strong className="text-amber-700">{extractedValues.odAxis || "—"}°</strong></p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Left Eye (OS)</span>
                <p>SPH: <strong className="text-amber-700">{formatSignedNotation(extractedValues.osSph || 0)}</strong></p>
                <p>CYL: <strong className="text-amber-700">{formatSignedNotation(extractedValues.osCyl || 0)}</strong></p>
                <p>AXIS: <strong className="text-amber-700">{extractedValues.osAxis || "—"}°</strong></p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between text-slate-700 font-semibold">
                <span>PD: <strong className="text-amber-700">{extractedValues.pd || "63"} mm</strong></span>
                {extractedValues.add && <span>ADD: <strong className="text-amber-700">{formatSignedNotation(extractedValues.add)}</strong></span>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOcrSanityOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Adjust Manually
              </button>
              <button
                onClick={handleApplyExtractedValues}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm Extracted Values
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
