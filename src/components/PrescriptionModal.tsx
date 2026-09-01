"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X, Check, ChevronRight, ArrowLeft, Camera, ImageIcon,
  Trash2, User, Phone, Scan, Sparkles, AlertCircle, Loader2, Pencil, Ruler,
  Lock, Edit2, UserCheck, LogIn, Calendar,
} from "lucide-react";
import PDMeasurementModal, { PDMeasurementResult } from "@/components/PDTool/PDMeasurementModal";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { compressImage } from "@/lib/nativeStorage";
import {
  SOLEX_LENS_OPTIONS,
  CORE_FIVE_LENS_IDS,
  SolexLensOption,
} from "@/lib/solex-lens-pricing";
import { calculateTotalLensPrice, calculateTotalProgressivePrice, BasePriceConfig, DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";
import { useLensPricing } from "@/hooks/useLensPricing";
import { useCartStore } from "@/store/useCartStore";
import {
  preprocessPrescriptionImage,
  parseOpticalPrescription,
  ExtractedPrescription,
} from "@/lib/ocrScanner";
import { useAuth } from "@/components/AuthProvider";

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
  /** Optional: pass a known user profile to auto-skip Step 1 */
  currentUser?: {
    id?: string;
    name?: string;
    phone?: string | null;
    age?: number | string | null;
    addPower?: string | null;
  } | null;
}

// Consumer-friendly display names & luxury badges for the 5 Core Options
const CORE_CONSUMER_LENSES: Record<string, { title: string; subtitle: string; description: string }> = {
  "progressive-freeform": {
    title: "MY EYES CR Hard Crystal Coat",
    subtitle: "Daily Scratch Resistance",
    description: "Single-vision clarity with standard hard crystal coating for daily scratch resistance.",
  },
  "sv-156-bluecut": {
    title: "MY EYES Blue Light Filter + UV Protection",
    subtitle: "Digital Shield",
    description: "Digital protection blocking harmful screen blue light and 100% UV rays.",
  },
  "sv-156-photogrey": {
    title: "MY EYES Sun Adaptive Photochromic",
    subtitle: "Smart Tint",
    description: "Darkens outdoors in sunlight and turns clear indoors automatically.",
  },
  "sv-156-photogrey-bluecut": {
    title: "MY EYES Dual Shield",
    subtitle: "Blue Light & Photochromic",
    description: "Ultimate dual protection: Photochromic tint outdoors with screen blue light filter indoors.",
  },
  "sv-167-shmc": {
    title: "MY EYES Ultra Thin Index",
    subtitle: "Ultra Thin Profile",
    description: "Ultra-thin profile engineered for stronger prescriptions to significantly reduce lens thickness.",
  },
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
        done ? "bg-amber-500 text-white" : active ? "bg-amber-50 text-amber-800 border border-amber-200/60" : "bg-slate-200 text-slate-500"
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
  isOpen, onClose, productName, productPrice, productId, onSubmit, currentUser,
}: PrescriptionModalProps) {
  // Auth context — used for pre-fill and auto-skip
  const { user: authUser, refetch: refetchAuth } = useAuth();

  // Strict sessionUser resolution: prioritize currentUser prop if valid ID & phone, else authUser if valid ID & phone
  const sessionUser = (currentUser?.id && currentUser?.phone)
    ? currentUser
    : (authUser?.id && authUser?.phone ? authUser : null);

  // Authenticated session detection strictly relies on immutable unique identifiers
  const isAuthenticated = Boolean(sessionUser?.id && sessionUser?.phone);

  // Step Sequence: 1 = Your Info, 2 = Choose Lenses, 3 = Prescription & Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Distinct Guest State (isolated — keystrokes never mutate session or auth state)
  const [guestFullName, setGuestFullName] = useState("");
  const [guestAge, setGuestAge] = useState("");
  const [guestWhatsapp, setGuestWhatsapp] = useState("");

  // Step 1: Logged-in editable age state
  const [loggedInAge, setLoggedInAge] = useState("");

  // Lead capture (populated upon Step 1 submission)
  const [lead, setLead] = useState({ name: "", age: "", whatsapp: "" });
  const [leadSaving, setLeadSaving] = useState(false);

  // Step 1: Sign-in / guest toggle
  const [isSignInView, setIsSignInView] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [step1Error, setStep1Error] = useState("");

  // Step 1: Age 40+ reading power
  const [needsReadingLenses, setNeedsReadingLenses] = useState(false);
  const [addPowerValue, setAddPowerValue] = useState("+1.50");
  const READING_ADD_VALUES = ["+0.50", "+0.75", "+1.00", "+1.25", "+1.50", "+1.75", "+2.00", "+2.25", "+2.50", "+2.75", "+3.00"];
  
  // Live dynamic lens pricing hook
  const { packages: dynamicPackages, basePrices: liveBasePrices, refresh: refreshLensPricing, isLoading: pricingLoading } = useLensPricing();
  const basePrices = liveBasePrices || DEFAULT_BASE_PRICES;
  const basePricesLoaded = !pricingLoading;

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

  // PD Measurement Studio
  const [pdModalOpen, setPdModalOpen] = useState(false);
  const [pdMeasured, setPdMeasured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [rx, setRx] = useState({
    odSph: "+0.00", odCyl: "+0.00", odAxis: "",
    osSph: "+0.00", osCyl: "+0.00", osAxis: "",
    pd: "63", add: "", rxFileUrl: "", notes: "",
  });

  // Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLead({ name: "", age: "", whatsapp: "" });
      setGuestFullName("");
      setGuestAge("");
      setGuestWhatsapp("");
      setLoggedInAge("");
      setIsSignInView(false);
      setLoginPhone("");
      setLoginPassword("");
      setStep1Error("");
      setNeedsReadingLenses(false);
      setAddPowerValue("+1.50");
      setUploadMode("upload");
      setRxFile(null);
      setRxPreview("");
      setOcrExtracted(false);
      setOcrError("");
      setOcrSanityOpen(false);
      setExtractedValues(null);
      setRx({ odSph: "+0.00", odCyl: "+0.00", odAxis: "", osSph: "+0.00", osCyl: "+0.00", osAxis: "", pd: "63", add: "", rxFileUrl: "", notes: "" });
      setSelectedLensId("progressive-freeform");
      setPdMeasured(false);
      setPdModalOpen(false);
    }
  }, [isOpen]);

  // Sync state for authenticated users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (isAuthenticated && sessionUser) {
      const uAge = parseInt(String(sessionUser.age ?? "0"), 10) || 0;
      const uAddPower = sessionUser.addPower ?? "";
      const uHasAdd = uAddPower !== "" && parseFloat(uAddPower) >= 0.5;
      if (uAge > 0) {
        setLoggedInAge(String(uAge));
      }
      if (uHasAdd && uAge >= 40) {
        setNeedsReadingLenses(true);
        setAddPowerValue(uAddPower);
        setRx(prev => ({ ...prev, add: uAddPower }));
      }
    } else {
      setGuestFullName("");
      setGuestAge("");
      setGuestWhatsapp("");
      setLoggedInAge("");
    }
  }, [isOpen, isAuthenticated, sessionUser]);

  const handlePDConfirm = useCallback((result: PDMeasurementResult) => {
    setRx(prev => ({ ...prev, pd: String(result.binocularPD) }));
    setPdMeasured(true);
    setPdModalOpen(false);
  }, []);

  // Load and strictly order the 5 Core Options with live dynamic pricing
  useEffect(() => {
    if (isOpen) {
      refreshLensPricing();
    }
  }, [isOpen, refreshLensPricing]);

  useEffect(() => {
    if (dynamicPackages && dynamicPackages.length > 0) {
      const coreOrdered = CORE_FIVE_LENS_IDS.map(id => {
        const found = dynamicPackages.find(l => l.id === id);
        const staticMatch = SOLEX_LENS_OPTIONS.find(l => l.id === id);
        if (found) {
          return {
            id: found.id,
            name: found.cleanName || found.name,
            coating: found.coating,
            index: found.index,
            description: found.description,
            category: (found.id === "progressive-freeform" ? "progressive" : "single_vision") as any,
            basePrice: found.standardBasePrice,
            pricePlus40: found.presbyopiaBasePrice,
          };
        }
        return staticMatch;
      }).filter((l): l is SolexLensOption => Boolean(l));

      if (coreOrdered.length > 0) {
        setLensOptions(coreOrdered);
      }
    }
  }, [dynamicPackages]);

  // Cart items count — only count prescription-configured frames for multi-frame detection
  const cartItems = useCartStore((s) => s.items);
  const cartFramesCount = useMemo(() =>
    cartItems
      .filter(item => item.prescription !== undefined)
      .reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  // +1 for the current frame being configured
  const totalSelectedFrames = useMemo(() => 1 + cartFramesCount, [cartFramesCount]);

  // Strict numeric parsing — guards against empty string and NaN
  const userAge = useMemo(() => {
    const raw = isAuthenticated ? loggedInAge : (step > 1 ? lead.age : guestAge);
    return parseInt(String(raw || "0"), 10) || 0;
  }, [isAuthenticated, loggedInAge, step, lead.age, guestAge]);
  const parsedAdd = useMemo(() => {
    const raw = rx.add.trim();
    if (!raw) return 0;
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
  }, [rx.add]);
  // ADD must be explicitly entered (non-empty) AND within clinical range
  const hasValidAdd = useMemo(() =>
    rx.add.trim() !== "" && parsedAdd >= 0.50 && parsedAdd <= 3.50,
    [rx.add, parsedAdd]
  );

  const flowMode = useMemo(() => {
    // FLOW 1: Standard Single Vision — age < 40, or no ADD entered
    if (userAge < 40 || !hasValidAdd || isNaN(parsedAdd)) {
      return "FLOW_1";
    }
    // FLOW 2: Multi-frame presbyopia bypass — 2+ prescription frames
    if (totalSelectedFrames >= 2) {
      return "FLOW_2";
    }
    // FLOW 3: Single-frame presbyopia progressive
    return "FLOW_3";
  }, [userAge, hasValidAdd, parsedAdd, totalSelectedFrames]);

  // Active customer lens list (defaults to static core if state loading)
  const activeCustomerLenses = useMemo(() => {
    let lenses = lensOptions;
    if (lenses.length === 0) {
      lenses = CORE_FIVE_LENS_IDS.map(id =>
        SOLEX_LENS_OPTIONS.find(l => l.id === id)
      ).filter((l): l is SolexLensOption => Boolean(l));
    }
    
    // In Progressive mode, hide Option 5 (sv-167-shmc)
    if (flowMode === "FLOW_3") {
      return lenses.filter(l => l.id !== "sv-167-shmc");
    }
    return lenses;
  }, [lensOptions, flowMode]);

  useEffect(() => {
    if (flowMode === "FLOW_3" && selectedLensId === "sv-167-shmc") {
      setSelectedLensId("progressive-freeform");
    }
  }, [flowMode, selectedLensId]);

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
    if (flowMode === "FLOW_3") {
      return calculateTotalProgressivePrice(
        selectedLensId,
        { sph: parsedOdSph, cyl: parsedOdCyl },
        { sph: parsedOsSph, cyl: parsedOsCyl },
        parsedAdd,
        basePrices
      );
    }
    return calculateTotalLensPrice(
      selectedLensId, 
      { sph: parsedOdSph, cyl: parsedOdCyl }, 
      { sph: parsedOsSph, cyl: parsedOsCyl }, 
      basePrices
    );
  }, [selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, parsedAdd, basePrices, basePricesLoaded, flowMode]);

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
    setStep1Error("");
    const resolvedName = isAuthenticated ? sessionUser?.name || "" : guestFullName.trim();
    const resolvedPhone = isAuthenticated
      ? (sessionUser?.phone ? sessionUser.phone.replace(/\D/g, "") : "")
      : guestWhatsapp.trim();
    const resolvedAge = isAuthenticated ? parseInt(loggedInAge, 10) : parseInt(guestAge, 10);

    if (!resolvedName || resolvedName.length < 2) {
      setStep1Error("Please provide your full name.");
      return;
    }
    if (isNaN(resolvedAge) || resolvedAge < 5 || resolvedAge > 120) {
      setStep1Error("Please enter a valid age to tailor your lenses.");
      return;
    }
    if (!isAuthenticated && resolvedPhone.length < 10) {
      setStep1Error("Please provide a valid WhatsApp number for order updates.");
      return;
    }

    setLead({ name: resolvedName, age: String(resolvedAge), whatsapp: resolvedPhone });

    // Write ADD power into rx state before advancing so flowMode is correct in Step 2
    if (needsReadingLenses && resolvedAge >= 40) {
      setRx(prev => ({ ...prev, add: addPowerValue }));
    }
    setLeadSaving(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resolvedName, age: resolvedAge, whatsapp: resolvedPhone, frameId: productId }),
      });
    } catch { /* fire-and-forget */ }
    setLeadSaving(false);
    setStep(2);
  };

  // Sign-in handler for returning customers with phone sanitization
  const handleSignIn = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) return;
    setStep1Error("");
    setIsSigningIn(true);

    const cleanIdentifier = loginPhone.replace(/\D/g, "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanIdentifier, whatsapp: cleanIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        await refetchAuth();
        setIsSignInView(false);
      } else {
        setStep1Error(data.error || "No account found with this WhatsApp number. Please check your number or password.");
      }
    } catch {
      setStep1Error("Connection error. Please check your internet and try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Final submit
  const handleFinalSubmit = () => {
    onSubmit({
      lensUsage: CORE_CONSUMER_LENSES[currentLensObj.id]?.title || currentLensObj.name,
      lensUsagePrice: exactCalculatedLensPrice,
      lensMaterial: CORE_CONSUMER_LENSES[currentLensObj.id]?.subtitle || "Precision Lens",
      lensMaterialPrice: 0,
      odSph: parsedOdSph,
      odCyl: parsedOdCyl || null,
      odAxis: rx.odAxis ? parseInt(rx.odAxis, 10) : null,
      osSph: parsedOsSph,
      osCyl: parsedOsCyl || null,
      osAxis: rx.osAxis ? parseInt(rx.osAxis, 10) : null,
      pd: parseFloat(rx.pd) || 63,
      add: flowMode === "FLOW_3" ? parsedAdd : null,
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Frosted Glass Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal Card with pop-in animation & modern studio layout (responsive bottom sheet on mobile) */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[92vh] z-10 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 ease-out">

        {/* Header: Fixed/Sticky at top so keyboard never pushes it off-screen */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-200/60 p-1">
              <Image
                src="/logo.svg"
                alt="MY EYES Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-extrabold tracking-wider text-amber-600 uppercase shrink-0">
                  MY EYES
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">
                  CONFIGURATOR
                </span>
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 leading-tight truncate max-w-[180px] sm:max-w-none">{productName}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent Luxury Back Button in Header (visible on Steps 2 and 3) */}
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
                <span>Back</span>
              </button>
            )}

            <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar (1: Your Info -> 2: Choose Lenses -> 3: Prescription & Review) */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
          <StepDot n={1} current={step} label="Your Info" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          <StepDot n={2} current={step} label="Choose Lenses" />
          <div className="h-px flex-1 bg-slate-200 min-w-[12px]" />
          <StepDot n={3} current={step} label="Prescription & Review" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 pb-6 sm:pb-8 overscroll-contain">

          {/* STEP 1: YOUR INFO (GUEST FIRST + AGE 40+ READING TOGGLE) */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Header row with sign-in toggle */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                    {isSignInView ? "Welcome Back" : isAuthenticated ? "Your Profile" : "Your Info"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {isSignInView
                      ? "Sign in to load your saved profile and skip ahead."
                      : "Quick details so we can match the right lenses for you."}
                  </p>
                </div>
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => { setIsSignInView(!isSignInView); setStep1Error(""); }}
                    className="text-[11px] sm:text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition cursor-pointer hover:underline shrink-0 pt-0.5 whitespace-nowrap"
                  >
                    {isSignInView ? (
                      <><User className="w-3.5 h-3.5" /><span>Guest Checkout</span></>
                    ) : (
                      <><LogIn className="w-3.5 h-3.5" /><span>Already have an account? Sign In</span></>
                    )}
                  </button>
                )}
              </div>

              {/* Error message */}
              {step1Error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
                  {step1Error}
                </div>
              )}

              {/* LOGGED-IN GREETING VIEW: Display customer name ONLY (no phone number) */}
              {isAuthenticated && !isSignInView ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#ff7a00] text-white flex items-center justify-center shadow-xs shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                          Welcome back, {sessionUser?.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Enter your age below to automatically tailor your lens options.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Your Age * <span className="text-slate-400 font-normal">(determines single-vision vs progressive options)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={loggedInAge}
                        onChange={e => setLoggedInAge(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none transition-all duration-150 bg-white"
                      />
                    </div>
                  </div>

                  {userAge >= 40 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Do you need reading / progressive lenses?
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            For distance + close-up reading in one pair.
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(false)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                              !needsReadingLenses ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(true)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer",
                              needsReadingLenses ? "bg-[#ff7a00] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            {needsReadingLenses && <Check className="w-3 h-3" />}
                            <span>Yes</span>
                          </button>
                        </div>
                      </div>

                      {needsReadingLenses && (
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                          <span className="text-xs font-semibold text-slate-700">Select Reading Power (+ADD):</span>
                          <select
                            value={addPowerValue}
                            onChange={e => setAddPowerValue(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 focus:outline-none cursor-pointer"
                          >
                            {READING_ADD_VALUES.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleProceedFromStep1}
                    disabled={leadSaving}
                    className={cn(
                      "w-full py-3.5 px-6 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] mt-2",
                      !leadSaving
                        ? "bg-[#ff7a00] hover:bg-[#e06c00] text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {leadSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                    {leadSaving ? "Saving..." : "Proceed to Choose Lenses"}
                    {!leadSaving && <ChevronRight className="w-4 h-4 text-white" />}
                  </button>
                </div>
              ) : !isSignInView ? (
                /* GUEST FORM — 3 clean fields (typing here NEVER touches auth or shows Welcome Back card) */
                <div className="space-y-3.5">

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={guestFullName}
                        onChange={e => setGuestFullName(e.target.value)}
                        placeholder="e.g. Ahmed Khan"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none bg-white transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Age * <span className="text-slate-400 font-normal">(tailors lenses)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={guestAge}
                        onChange={e => setGuestAge(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none bg-white transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Number *</label>
                    <div className="flex items-center rounded-2xl border border-slate-200 focus-within:border-[#ff7a00] focus-within:ring-4 focus-within:ring-[#ff7a00]/10 overflow-hidden transition-all duration-150 min-h-[48px]">
                      <span className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-600 font-semibold flex items-center gap-1 flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        +92
                      </span>
                      <input
                        type="tel"
                        value={guestWhatsapp}
                        onChange={e => setGuestWhatsapp(e.target.value.replace(/\D/g, ""))}
                        placeholder="3xx-xxxxxxx"
                        className="flex-1 px-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Age 40+ Reading Power Section — renders ONLY when age >= 40 */}
                  {userAge >= 40 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Do you need reading / progressive lenses?
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            For distance + close-up reading in one pair.
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(false)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                              !needsReadingLenses ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(true)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer",
                              needsReadingLenses ? "bg-[#ff7a00] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            {needsReadingLenses && <Check className="w-3 h-3" />}
                            <span>Yes</span>
                          </button>
                        </div>
                      </div>

                      {needsReadingLenses && (
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                          <span className="text-xs font-semibold text-slate-700">Select Reading Power (+ADD):</span>
                          <select
                            value={addPowerValue}
                            onChange={e => setAddPowerValue(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 focus:outline-none cursor-pointer"
                          >
                            {READING_ADD_VALUES.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleProceedFromStep1}
                    disabled={leadSaving}
                    className={cn(
                      "w-full py-3.5 px-6 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] mt-2",
                      !leadSaving
                        ? "bg-[#ff7a00] hover:bg-[#e06c00] text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {leadSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                    {leadSaving ? "Saving..." : "Choose Lenses"}
                    {!leadSaving && <ChevronRight className="w-4 h-4 text-white" />}
                  </button>
                </div>
              ) : (
                /* RETURNING CUSTOMER SIGN-IN */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                    <div className="flex items-center rounded-2xl border border-slate-200 focus-within:border-[#ff7a00] focus-within:ring-4 focus-within:ring-[#ff7a00]/10 overflow-hidden transition-all duration-150 min-h-[48px]">
                      <span className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-600 font-semibold flex items-center gap-1 flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        +92
                      </span>
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="3xx-xxxxxxx"
                        className="flex-1 px-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none bg-white transition-all duration-150"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className={cn(
                      "w-full py-3.5 px-6 min-h-[48px] rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] mt-2",
                      isSigningIn
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#ff7a00] hover:bg-[#e06c00] text-white"
                    )}
                  >
                    {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                    {isSigningIn ? "Signing in..." : "Sign In & Continue"}
                    {!isSigningIn && <ChevronRight className="w-4 h-4 text-white" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHOOSE LENSES (STRICTLY 5 CORE OPTIONS) */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Identity banner — shown when lead data is populated (NO phone number displayed) */}
              {lead.name && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ff7a00] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {isAuthenticated ? `Logged in as ${lead.name}` : `Profile: ${lead.name}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Age: {lead.age} yrs{needsReadingLenses ? ` | Reading ADD: ${addPowerValue}` : " | Single-Vision"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-[#ff7a00]" />
                    <span>Edit</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Select Frame Lens Package</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {flowMode === "FLOW_3"
                      ? "Progressive (+40) compatible lenses — Ultra Thin excluded."
                      : "Select from our 5 core precision optical lens packages."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Info
                </button>
              </div>

              {/* FLOW_3: Progressive mode banner */}
              {flowMode === "FLOW_3" && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Progressive (+40) Mode — Lenses are matched to your near addition ({rx.add}) for seamless bifocal vision.</span>
                </div>
              )}

              {/* FLOW_2: Multi-frame bypass pill */}
              {flowMode === "FLOW_2" && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
                  <Check className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <span>Multi-frame package detected — Standard single-vision lens rates applied.</span>
                </div>
              )}

              <div className="space-y-3">
                {activeCustomerLenses.map((lens, idx) => {
                  const isSelected = selectedLensId === lens.id;

                  // Progressive mode: override titles to clearly label as progressive lenses
                  const PROGRESSIVE_CONSUMER_LENSES: Record<string, { title: string; subtitle: string; description: string }> = {
                    "progressive-freeform": {
                      title: "MY EYES Progressive Standard",
                      subtitle: "Progressive",
                      description: "No-line seamless transition between distance, intermediate, and near vision with hard crystal coating.",
                    },
                    "sv-156-bluecut": {
                      title: "MY EYES Progressive Blue Light Filter",
                      subtitle: "Progressive + Blue Shield",
                      description: "Progressive distance-to-reading vision with full digital screen blue light & UV protection.",
                    },
                    "sv-156-photogrey": {
                      title: "MY EYES Progressive Sun Adaptive",
                      subtitle: "Progressive + Smart Tint",
                      description: "Progressive lens that darkens automatically outdoors and clears indoors — distance to near.",
                    },
                    "sv-156-photogrey-bluecut": {
                      title: "MY EYES Progressive Dual Shield",
                      subtitle: "Progressive + Blue + Photochromic",
                      description: "Ultimate progressive protection: sun-adaptive tint + blue light filter across full vision range.",
                    },
                  };

                  const consumerLens = flowMode === "FLOW_3"
                    ? (PROGRESSIVE_CONSUMER_LENSES[lens.id] || { title: lens.name, subtitle: "Progressive", description: lens.description })
                    : (CORE_CONSUMER_LENSES[lens.id] || { title: lens.name, subtitle: "", description: lens.description });

                  const dynamicMatch = dynamicPackages.find(p => p.id === lens.id);
                  const activeBaseStartingPrice = flowMode === "FLOW_3"
                    ? (dynamicMatch?.presbyopiaBasePrice ?? (lens.pricePlus40 || lens.basePrice + 400))
                    : (dynamicMatch?.standardBasePrice ?? lens.basePrice);

                  const lensPricingResult = flowMode === "FLOW_3"
                    ? calculateTotalProgressivePrice(
                        lens.id,
                        { sph: parsedOdSph, cyl: parsedOdCyl },
                        { sph: parsedOsSph, cyl: parsedOsCyl },
                        parsedAdd,
                        basePrices
                      )
                    : calculateTotalLensPrice(
                        lens.id,
                        { sph: parsedOdSph, cyl: parsedOdCyl },
                        { sph: parsedOsSph, cyl: parsedOsCyl },
                        basePrices
                      );

                  const calcPrice = lensPricingResult
                    ? lensPricingResult.finalPrice
                    : activeBaseStartingPrice;
                  const isLensOutOfRange = lensPricingResult === null && basePricesLoaded && flowMode !== "FLOW_3";

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
                      <div className="flex items-start gap-3 w-full">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5",
                          isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">{consumerLens.title}</span>
                              {consumerLens.subtitle && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap",
                                  flowMode === "FLOW_3"
                                    ? isSelected ? "bg-amber-200 text-amber-900" : "bg-amber-100 text-amber-700"
                                    : isSelected ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-600"
                                )}>
                                  {consumerLens.subtitle}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                              {isLensOutOfRange ? (
                                <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded block whitespace-nowrap">Out of Range</span>
                              ) : (
                                <span className="text-sm sm:text-base font-bold text-[#0F172A] whitespace-nowrap block">Starting from Rs. {calcPrice.toLocaleString()}/-</span>
                              )}
                              {isSelected && <Check className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 ml-auto sm:ml-0" />}
                            </div>
                          </div>

                          <div className="w-full">
                            <p className="text-sm text-neutral-600 leading-relaxed">{consumerLens.description}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#ff7a00] hover:bg-[#e06c00] text-white text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer shadow-xs">
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

                  {/* PD and ADD */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">PD (mm)</label>
                        <button
                          type="button"
                          id="pd-studio-trigger-btn"
                          onClick={() => setPdModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-[9px] font-bold text-[#ff7a00] uppercase tracking-wider transition-colors"
                        >
                          <Ruler className="w-2.5 h-2.5" />
                          Measure
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={rx.pd}
                          onChange={e => { setRx(prev => ({ ...prev, pd: e.target.value })); setPdMeasured(false); }}
                          className={cn("w-full px-3 py-2 rounded-xl border text-slate-900 text-xs font-bold text-center focus:ring-2 focus:outline-none bg-white transition-all",
                            pdMeasured
                              ? "border-emerald-300 focus:ring-emerald-200 bg-emerald-50/40"
                              : "border-slate-200 focus:ring-amber-400"
                          )}
                          placeholder="63"
                        />
                        {pdMeasured && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>
                      {pdMeasured && (
                        <p className="text-[9px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Optically measured
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">ADD Power</label>
                      <input
                        type="text"
                        value={rx.add}
                        onChange={e => setRx(prev => ({ ...prev, add: e.target.value }))}
                        onBlur={() => {
                          if (rx.add && !isNaN(parseFloat(rx.add))) {
                            setRx(prev => ({ ...prev, add: formatSignedNotation(rx.add) }));
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold text-center focus:ring-2 focus:ring-amber-400 bg-white"
                        placeholder="+1.50"
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
                      {CORE_CONSUMER_LENSES[currentLensObj.id]?.title || currentLensObj?.name}
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
                    <span className="font-bold text-slate-900">
                      Prescription Lenses — +Rs. {exactCalculatedLensPrice.toLocaleString()}/-
                    </span>
                  )}
                </div>

                {/* 4. Per-Eye Breakdown (If Asymmetric) */}
                {!isOutOfRange && pricingResult?.isAsymmetricRx && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/50 border border-amber-200/50 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span>Right Eye (OD) — +Rs. {pricingResult.rightEyeLensPrice}/-</span>
                      <span className="font-mono">({pricingResult.rightMultiplier?.toFixed(2)}x)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Left Eye (OS) — +Rs. {pricingResult.leftEyeLensPrice}/-</span>
                      <span className="font-mono">({pricingResult.leftMultiplier?.toFixed(2)}x)</span>
                    </div>
                    <div className="text-[9px] text-slate-500 text-center border-t border-amber-200/40 pt-1 mt-1 font-semibold">
                      Combined Lens Price: Rs. {exactCalculatedLensPrice}/-
                    </div>
                  </div>
                )}

                {uploadMode === "manual" && (
                  <div className="text-[10px] font-mono text-slate-600 bg-white rounded-xl border border-slate-200 p-2.5 space-y-0.5">
                    <p>OD: SPH {rx.odSph || "0.00"} CYL {rx.odCyl || "+0.00"} AXIS {rx.odAxis || "—"}</p>
                    <p>OS: SPH {rx.osSph || "0.00"} CYL {rx.osCyl || "+0.00"} AXIS {rx.osAxis || "—"}</p>
                    <p>PD: {rx.pd}mm {flowMode === "FLOW_3" && `| ADD: ${rx.add}`}</p>
                  </div>
                )}

                {/* 5. Live Total */}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900">Total</span>
                  <span className="text-base font-extrabold text-slate-900">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Cash on Delivery Advance Payment Notice Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold shadow-2xs">
                {flowMode === "FLOW_3" || (userAge >= 40 && parsedAdd >= 0.50)
                  ? "40% advance must for Cash on Delivery progressive orders."
                  : "25% advance must for Cash on Delivery orders."}
              </div>

              {/* WhatsApp PD Measurement Notice for Presbyopia (+40) Flow */}
              {(flowMode === "FLOW_3" || (userAge >= 40 && parsedAdd >= 0.50)) && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
                  <strong>Pupillary Distance (PD) Measurement:</strong> For custom Presbyopia (+40) progressive lenses, our optical team will contact you directly on WhatsApp after order placement for your exact Pupillary Distance (PD) measurement.
                </div>
              )}

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
                  isOutOfRange ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#ff7a00] hover:bg-[#e06c00] text-white cursor-pointer"
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

      {/* PD Measurement Studio Modal */}
      <PDMeasurementModal
        isOpen={pdModalOpen}
        onClose={() => setPdModalOpen(false)}
        onConfirm={handlePDConfirm}
      />
    </div>
  );
}
