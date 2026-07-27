"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X, Check, ChevronRight, ArrowLeft, Camera, ImageIcon,
  Trash2, User, Phone, Scan, Sparkles, AlertCircle, Loader2
} from "lucide-react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { compressImage } from "@/lib/nativeStorage";
import {
  SOLEX_LENS_OPTIONS,
  calculateSolexLensPrice,
  SolexLensOption,
} from "@/lib/solex-lens-pricing";
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
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  productId?: string;
  onSubmit: (details: PrescriptionDetails, totalPrice: number) => void;
}

// Lens IDs pruned from customer-facing configurator (kept in DB for admin)
const PRUNED_LENS_IDS = new Set([
  "bifocal-round-top",
  "bifocal-flat-top",
  "sv-159-pc",
  "sv-156-hmc",
]);

// Consumer-friendly display names
const CONSUMER_NAMES: Record<string, { name: string; badge: string; icon: string }> = {
  "sv-156-hc":               { name: "MY EYES Single Vision Standard", badge: "Everyday",      icon: "👓" },
  "sv-156-bluecut":          { name: "MY EYES Anti-Blue Light Shield",  badge: "Digital Guard",  icon: "🛡️" },
  "sv-156-photogrey":        { name: "MY EYES Sun-Adaptive Photochromic",badge: "Smart Tint",    icon: "☀️" },
  "sv-156-photogrey-bluecut":{ name: "MY EYES Dual Shield — Blue + Photochromic",badge: "Premium", icon: "✨" },
  "sv-159-pc-bluecut":       { name: "MY EYES Polycarbonate Blue Cut Shield", badge: "Impact-Safe", icon: "🔒" },
  "sv-167-shmc":             { name: "MY EYES Ultra-Thin High Index",    badge: "Strong Rx",     icon: "💎" },
  "progressive-freeform":    { name: "MY EYES Progressive Free Form",    badge: "+40 Premium",   icon: "💎" },
};

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
  // Step: 1=Contact, 2=Presbyopia (+40), 3=Prescription, 4=Lens+Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Lead capture
  const [lead, setLead] = useState({ name: "", age: "", whatsapp: "" });
  const [leadSaving, setLeadSaving] = useState(false);
  const leadValid = lead.name.trim().length > 1 && Number(lead.age) > 0 && lead.whatsapp.replace(/\D/g, "").length >= 10;

  // Step 2: Presbyopia
  const [hasAdd, setHasAdd] = useState<boolean | null>(null);
  const [addPower, setAddPower] = useState("+1.50");
  const [frameSetup, setFrameSetup] = useState<"separate" | "combined" | null>(null);

  // Step 3: Prescription & OCR
  const [uploadMode, setUploadMode] = useState<"manual" | "upload">("upload");
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
    odSph: "0.00", odCyl: "0.00", odAxis: "",
    osSph: "0.00", osCyl: "0.00", osAxis: "",
    pd: "63", add: "+1.50", rxFileUrl: "", notes: "",
  });

  // Step 4: Lens selection
  const [selectedLensId, setSelectedLensId] = useState<string>("sv-156-bluecut");
  const [lensOptions, setLensOptions] = useState<SolexLensOption[]>(
    SOLEX_LENS_OPTIONS.filter(l => !PRUNED_LENS_IDS.has(l.id))
  );

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLead({ name: "", age: "", whatsapp: "" });
      setHasAdd(null);
      setAddPower("+1.50");
      setFrameSetup(null);
      setUploadMode("upload");
      setRxFile(null);
      setRxPreview("");
      setOcrExtracted(false);
      setOcrError("");
      setOcrSanityOpen(false);
      setExtractedValues(null);
      setRx({ odSph: "0.00", odCyl: "0.00", odAxis: "", osSph: "0.00", osCyl: "0.00", osAxis: "", pd: "63", add: "+1.50", rxFileUrl: "", notes: "" });
      setSelectedLensId("sv-156-bluecut");
    }
  }, [isOpen]);

  // Load DB lens options (filtered)
  useEffect(() => {
    async function loadLensOptions() {
      try {
        const res = await fetch("/api/admin/lens-prices");
        if (res.ok) {
          const data = await res.json();
          const filtered = (data as SolexLensOption[]).filter(l => !PRUNED_LENS_IDS.has(l.id));
          if (filtered.length > 0) setLensOptions(filtered);
        }
      } catch { /* fallback to static */ }
    }
    if (isOpen) loadLensOptions();
  }, [isOpen]);

  // Pricing calculations
  const parsedOdSph = parseFloat(rx.odSph) || 0;
  const parsedOdCyl = parseFloat(rx.odCyl) || 0;
  const parsedOsSph = parseFloat(rx.osSph) || 0;
  const parsedOsCyl = parseFloat(rx.osCyl) || 0;
  const parsedAdd = parseFloat(rx.add) || 0;
  const maxSph = Math.abs(parsedOdSph) > Math.abs(parsedOsSph) ? parsedOdSph : parsedOsSph;
  const maxCyl = Math.abs(parsedOdCyl) > Math.abs(parsedOsCyl) ? parsedOdCyl : parsedOsCyl;

  const isPresbyopiaActive = useMemo(() => {
    return parsedAdd > 0 || hasAdd === true || (parseInt(lead.age) >= 40 && hasAdd !== false);
  }, [parsedAdd, hasAdd, lead.age]);

  const currentLensObj = useMemo(() =>
    lensOptions.find(l => l.id === selectedLensId) || lensOptions[0] || SOLEX_LENS_OPTIONS[0],
    [lensOptions, selectedLensId]
  );

  const exactCalculatedLensPrice = useMemo(() =>
    calculateSolexLensPrice(
      selectedLensId,
      maxSph,
      maxCyl,
      parsedAdd,
      currentLensObj?.basePrice,
      isPresbyopiaActive,
      currentLensObj?.pricePlus40
    ),
    [selectedLensId, maxSph, maxCyl, parsedAdd, currentLensObj, isPresbyopiaActive]
  );

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

  // High-Precision Preprocessed OCR scan using Tesseract.js & Domain Parser
  const handleOcrScan = useCallback(async () => {
    if (!rxPreview) return;
    setOcrScanning(true);
    setOcrError("");
    try {
      // 1. Contrast enhancement & adaptive binarization thresholding
      const sharpenedImage = await preprocessPrescriptionImage(rxPreview);

      // 2. Execute Tesseract OCR
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(sharpenedImage);
      await worker.terminate();

      // 3. Domain Optical Regex Extraction
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
      if (extractedValues.odSph) updates.odSph = extractedValues.odSph;
      if (extractedValues.osSph) updates.osSph = extractedValues.osSph;
      if (extractedValues.odCyl) updates.odCyl = extractedValues.odCyl;
      if (extractedValues.osCyl) updates.osCyl = extractedValues.osCyl;
      if (extractedValues.odAxis) updates.odAxis = extractedValues.odAxis;
      if (extractedValues.osAxis) updates.osAxis = extractedValues.osAxis;
      if (extractedValues.pd) updates.pd = extractedValues.pd;
      if (extractedValues.add) {
        updates.add = extractedValues.add;
        setAddPower(extractedValues.add);
        setHasAdd(true);
      }

      setRx(prev => ({ ...prev, ...updates }));
      setOcrExtracted(true);
      setUploadMode("manual");
    }
    setOcrSanityOpen(false);
  };

  // Step 1 → submit lead, advance
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
    const age = parseInt(lead.age);
    if (age >= 40) { setStep(2); }
    else { setStep(3); }
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
      add: parsedAdd || null,
      rxFileUrl: rx.rxFileUrl,
      notes: rx.notes,
    }, totalPrice);
    onClose();
  };

  if (!isOpen) return null;

  const age = parseInt(lead.age) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[93vh] animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 relative flex-shrink-0 overflow-hidden">
                <Image alt="MY EYES" className="object-contain" fill src="/images/logo.png" />
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase whitespace-nowrap">
                MY EYES CONFIGURATOR
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight mt-1">{productName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <StepDot n={1} current={step} label="Your Info" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          {age >= 40 && (
            <>
              <StepDot n={2} current={step} label="+40 Guide" />
              <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
            </>
          )}
          <StepDot n={age >= 40 ? 3 : 2} current={step} label="Prescription" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          <StepDot n={age >= 40 ? 4 : 3} current={step} label="Lens & Review" />
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* STEP 1: CUSTOMER INFO (LEAD CAPTURE) */}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age <span className="text-slate-400 font-normal">(Helps us recommend the right lenses)</span></label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={lead.age}
                    onChange={e => setLead({ ...lead, age: e.target.value })}
                    placeholder="e.g. 42"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white transition-all"
                  />
                  {parseInt(lead.age) >= 40 && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-1.5 mt-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      We&apos;ll guide you through our +40 age presbyopia lens assistant next.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      🇵🇰 +92
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
                {leadSaving ? "Saving..." : "Proceed to Lenses"}
                {!leadSaving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* STEP 2: +40 PRESBYOPIA ASSISTANT */}
          {step === 2 && (
            <div className="space-y-5">
              <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <div className="flex items-center gap-2.5 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-900">+40 Presbyopia Assistant</h4>
                </div>
                <p className="text-xs text-slate-600">Since you&apos;re {lead.age} years old, you may need progressive reading lenses. Let us guide you.</p>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-800">Do you have an Addition (ADD) value on your prescription?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setHasAdd(val)}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer",
                        hasAdd === val ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {val ? "Yes, I have ADD" : "No / Not sure"}
                    </button>
                  ))}
                </div>
              </div>

              {hasAdd === true && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ADD Power <span className="text-slate-400 font-normal">(e.g. +1.00 to +3.50)</span></label>
                  <input
                    type="text"
                    value={addPower}
                    onChange={e => { setAddPower(e.target.value); setRx(prev => ({ ...prev, add: e.target.value })); }}
                    placeholder="+1.50"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white"
                  />
                </div>
              )}

              {hasAdd !== null && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-800">Are your distance and reading powers in separate glasses or one frame?</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { val: "separate" as const, title: "2 Separate Frames", desc: "One for distance, one for reading. We'll suggest adding 2 items.", icon: "👓👓" },
                      { val: "combined" as const, title: "1 Combined Frame (Progressive Free Form)", desc: "Distance, mid & reading seamlessly combined with line-free transition.", icon: "🔮" },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setFrameSetup(opt.val)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                          frameSetup === opt.val ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{opt.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{opt.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                          {frameSetup === opt.val && <Check className="w-4 h-4 text-amber-600 ml-auto flex-shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frameSetup === "combined" && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Defaulted to MY EYES Progressive Free Form
                  </div>
                  <p className="text-[11px] text-amber-700">Line-free seamless transition between distance and reading vision for superior aesthetic comfort.</p>
                </div>
              )}

              {frameSetup === "separate" && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Consider adding this frame twice to your bag — once configured for distance lenses, once for reading lenses.
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={hasAdd === null || (frameSetup === null && hasAdd !== false)}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer",
                  hasAdd !== null
                    ? "bg-slate-900 hover:bg-black text-white shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                Continue to Prescription <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: PRESCRIPTION ENTRY (OCR or MANUAL) */}
          {step === 3 && (
            <div className="space-y-5">
              <button
                onClick={() => setStep(age >= 40 ? 2 : 1)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h4 className="text-sm font-bold text-slate-900">Enter Your Prescription</h4>
                <p className="text-xs text-slate-500 mt-0.5">Scan your prescription card with high precision or enter values manually.</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

              {!rxPreview ? (
                <div
                  className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-7 text-center transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 mx-auto mb-3 flex items-center justify-center">
                    <Scan className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">Scan Prescription Card</p>
                  <p className="text-[11px] text-slate-500 mb-4">Drag & drop or tap to upload — AI canvas contrast sharpening auto-extracts your values</p>
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                    <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" /> Choose from Gallery
                    </button>
                    <button type="button" onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                      <Camera className="w-3.5 h-3.5" /> Take Photo
                    </button>
                  </div>
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
                      <Loader2 className="w-4 h-4 animate-spin" /> Sharpening image & extracting optical parameters...
                    </div>
                  )}
                  {ocrExtracted && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5" /> Prescription parameters verified! Review and adjust below if needed.
                    </div>
                  )}
                  {ocrError && (
                    <div className="flex items-center gap-2 text-xs text-red-700 font-semibold bg-red-50 border border-red-200/60 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5" /> {ocrError}
                    </div>
                  )}
                </div>
              )}

              {/* Manual entry toggle */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setUploadMode(prev => prev === "manual" ? "upload" : "manual")}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  {uploadMode === "manual" ? "↑ Hide manual entry" : "✏️ Enter manually instead"}
                </button>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {uploadMode === "manual" && (
                <div className="space-y-3">
                  {/* OD */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Right Eye (OD)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "SPH", key: "odSph", placeholder: "0.00" },
                        { label: "CYL", key: "odCyl", placeholder: "0.00" },
                        { label: "AXIS", key: "odAxis", placeholder: "90" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-[10px] text-slate-500 mb-1 font-semibold">
                            {f.label}
                            {ocrExtracted && rx[f.key as keyof typeof rx] && rx[f.key as keyof typeof rx] !== "0.00" && rx[f.key as keyof typeof rx] !== "" && (
                              <span className="ml-1 px-1 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded uppercase">AI</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step={f.key.includes("Axis") ? "1" : "0.25"}
                            value={rx[f.key as keyof typeof rx]}
                            onChange={e => setRx({ ...rx, [f.key]: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white min-h-[42px]"
                            placeholder={f.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OS */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Left Eye (OS)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "SPH", key: "osSph", placeholder: "0.00" },
                        { label: "CYL", key: "osCyl", placeholder: "0.00" },
                        { label: "AXIS", key: "osAxis", placeholder: "90" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-[10px] text-slate-500 mb-1 font-semibold">
                            {f.label}
                            {ocrExtracted && rx[f.key as keyof typeof rx] && rx[f.key as keyof typeof rx] !== "0.00" && rx[f.key as keyof typeof rx] !== "" && (
                              <span className="ml-1 px-1 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded uppercase">AI</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step={f.key.includes("Axis") ? "1" : "0.25"}
                            value={rx[f.key as keyof typeof rx]}
                            onChange={e => setRx({ ...rx, [f.key]: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white min-h-[42px]"
                            placeholder={f.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">PD (mm)</label>
                      <input type="number" step="0.5" value={rx.pd}
                        onChange={e => setRx({ ...rx, pd: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white"
                        placeholder="63" />
                    </div>
                    {hasAdd !== false && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Near ADD</label>
                        <input type="text" value={rx.add}
                          onChange={e => setRx({ ...rx, add: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none bg-white"
                          placeholder="+1.50" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Special Instructions <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea rows={2} value={rx.notes} onChange={e => setRx({ ...rx, notes: e.target.value })}
                      placeholder="e.g. Reading distance focus, progressive customization..."
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 focus:outline-none resize-none" />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={uploadMode === "upload" && !rxPreview}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer",
                  (uploadMode === "manual" || rxPreview)
                    ? "bg-slate-900 hover:bg-black text-white shadow-sm"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4" /> Continue to Lens Selection
              </button>
            </div>
          )}

          {/* STEP 4: LENS SELECTION + REVIEW */}
          {step === 4 && (
            <div className="space-y-5">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h4 className="text-sm font-bold text-slate-900">Choose Your Lens</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPresbyopiaActive
                    ? "Pricing calculated from +40 Presbyopia Precision Lens Matrix."
                    : "Pricing calculated from Standard Precision Lens Matrix."}
                </p>
              </div>

              {isPresbyopiaActive && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-xs font-bold text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  +40 Presbyopia Pricing Tier Applied
                </div>
              )}

              <div className="space-y-2.5">
                {lensOptions.map(lens => {
                  const calcPrice = calculateSolexLensPrice(
                    lens.id,
                    maxSph,
                    maxCyl,
                    parsedAdd,
                    lens.basePrice,
                    isPresbyopiaActive,
                    lens.pricePlus40
                  );
                  const display = CONSUMER_NAMES[lens.id];
                  const isSelected = selectedLensId === lens.id;
                  return (
                    <button
                      key={lens.id}
                      onClick={() => setSelectedLensId(lens.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
                        isSelected ? "border-amber-400 bg-amber-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-lg flex-shrink-0 mt-0.5">{display?.icon || "👓"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{display?.name || lens.name}</span>
                              {display?.badge && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                  isSelected ? "bg-amber-200 text-amber-800" : "bg-slate-100 text-slate-600"
                                )}>
                                  {display.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{lens.description}</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{lens.index} Index · {lens.coating}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-extrabold text-slate-900 block">+Rs. {calcPrice}/-</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 ml-auto mt-0.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Price Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Price Summary</p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Frame — {productName}</span>
                  <span className="font-bold text-slate-900">{formatPrice(productPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{CONSUMER_NAMES[selectedLensId]?.name || currentLensObj?.name || "Selected Lens"}</span>
                  <span className="font-bold text-slate-900">+Rs. {exactCalculatedLensPrice}/-</span>
                </div>
                {uploadMode === "manual" && (
                  <div className="text-[10px] font-mono text-slate-500 bg-white rounded-lg border border-slate-200 p-2.5 space-y-0.5">
                    <p>OD: SPH {rx.odSph} CYL {rx.odCyl || "0.00"} AXIS {rx.odAxis || "—"}</p>
                    <p>OS: SPH {rx.osSph} CYL {rx.osCyl || "0.00"} AXIS {rx.osAxis || "—"}</p>
                    <p>PD: {rx.pd}mm {rx.add ? `· ADD: ${rx.add}` : ""}</p>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900">Total</span>
                  <span className="text-base font-extrabold text-slate-900">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
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
                <p>SPH: <strong className="text-amber-700">{extractedValues.odSph || "0.00"}</strong></p>
                <p>CYL: <strong className="text-amber-700">{extractedValues.odCyl || "0.00"}</strong></p>
                <p>AXIS: <strong className="text-amber-700">{extractedValues.odAxis || "—"}°</strong></p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Left Eye (OS)</span>
                <p>SPH: <strong className="text-amber-700">{extractedValues.osSph || "0.00"}</strong></p>
                <p>CYL: <strong className="text-amber-700">{extractedValues.osCyl || "0.00"}</strong></p>
                <p>AXIS: <strong className="text-amber-700">{extractedValues.osAxis || "—"}°</strong></p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between text-slate-700 font-semibold">
                <span>PD: <strong className="text-amber-700">{extractedValues.pd || "63"} mm</strong></span>
                {extractedValues.add && <span>ADD: <strong className="text-amber-700">{extractedValues.add}</strong></span>}
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
