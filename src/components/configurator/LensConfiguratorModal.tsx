'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Glasses,
  Check,
  CheckCircle2,
  Eye,
  Zap,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useLensPricing } from '@/hooks/useLensPricing';
import { cn } from '@/lib/utils';
import {
  SPH_OPTIONS,
  CYL_OPTIONS,
  AXIS_OPTIONS,
  ADD_OPTIONS,
  DEFAULT_SPH,
  DEFAULT_CYL,
  DEFAULT_AXIS,
  DEFAULT_ADD,
} from '@/lib/constants/prescription';
import PrescriptionPickerSheet from './PrescriptionPickerSheet';
import Step4Prescription from './Step4Prescription';
import {
  calculateTotalLensPrice,
  calculateTotalProgressivePrice,
  TotalPricingResult,
} from '@/lib/pricingEngine';

export {
  SPH_OPTIONS,
  CYL_OPTIONS,
  AXIS_OPTIONS,
  ADD_OPTIONS,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FrameDetails {
  id: string;
  name: string;
  price: number;
  sku?: string;
  imageUrl?: string;
  color?: string;
}

export interface UserSessionProfile {
  id?: string;
  name?: string;
  phone?: string | null;
  age?: number | string | null;
  addPower?: string | null;
}

export interface LensConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame: FrameDetails;
  currentUser?: UserSessionProfile | null;
  onAddToCart?: (config: any) => void;
}

export interface CustomerProfile {
  fullName: string;
  whatsapp: string;
  age?: number;
  needsReadingLenses?: boolean;
  addPower?: string | null;
}

type VisionType = 'standard' | 'progressive';
type PrescriptionTab = 'upload' | 'manual';

export interface ActivePickerState {
  field: 'odSph' | 'odCyl' | 'odAxis' | 'osSph' | 'osCyl' | 'osAxis' | 'add';
  title: string;
  subtitle?: string;
  options: string[];
  value: string;
  unit?: string;
}

// ─── Step Progress Indicator ─────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Contact' },
  { num: 2, label: 'Vision' },
  { num: 3, label: 'Lenses' },
  { num: 4, label: 'Prescription' },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {STEPS.map((s, i) => {
        const isCurrent = current === s.num;
        const isCompleted = current > s.num;

        return (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                  isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.num}
              </div>
              <span
                className={cn(
                  'text-xs font-bold transition-colors hidden sm:block',
                  isCurrent
                    ? 'text-slate-900'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 transition-colors mx-1',
                  isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Plain English 2-Bullet Lens Benefit Definitions ──────────────────────────

const SINGLE_VISION_TIER_INFO: Record<string, { title: string; bullets: string[] }> = {
  B1: {
    title: "Clear Everyday Lenses",
    bullets: [
      "Easy on the eyes, clear everyday vision",
      "Scratch-resistant coating so they last longer",
    ],
  },
  B2: {
    title: "Screen Protection (Blue Light)",
    bullets: [
      "Stops eye strain from phones, laptops, and TVs",
      "Helps prevent headaches and tired eyes after work",
    ],
  },
  B3: {
    title: "Auto-Darkening (Transitions)",
    bullets: [
      "Clear inside your room, turns into sunglasses in the sun",
      "Glasses and sunglasses in one single frame",
    ],
  },
  B4: {
    title: "All-in-One (Screen Guard + Sun)",
    bullets: [
      "Blocks harsh screen glare while you work",
      "Darkens automatically when you step outside",
    ],
  },
  B5: {
    title: "Ultra Thin Slim Lenses",
    bullets: [
      "Extra slim and lightweight lenses for high powers",
      "Maximum clarity without heavy or thick glass edges",
    ],
  },
};

const PROGRESSIVE_TIER_INFO: Record<string, { title: string; bullets: string[] }> = {
  B1: {
    title: "Clear Everyday Progressive",
    bullets: [
      "One pair for phone reading, computer, and driving without switching glasses",
      "Smooth transition from reading to distance with no visible lines",
    ],
  },
  B2: {
    title: "Screen Protection Progressive",
    bullets: [
      "Blocks harsh blue light from laptops and phones while you work",
      "Clear reading and distance vision with reduced eye strain",
    ],
  },
  B3: {
    title: "Auto-Darkening Progressive",
    bullets: [
      "Darkens into sunglasses outdoors while keeping your reading power clear",
      "No need to carry separate prescription sunglasses",
    ],
  },
  B4: {
    title: "All-in-One Ultimate Progressive",
    bullets: [
      "Full screen guard indoors and auto sun-darkening tint outdoors",
      "Perfect all-in-one vision for work, driving, and reading",
    ],
  },
  B5: {
    title: "Ultra Thin Progressive",
    bullets: [
      "Slim high-index progressive profile for higher powers",
      "Lightweight everyday comfort with seamless multi-focus",
    ],
  },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function LensConfiguratorModal({
  isOpen,
  onClose,
  frame,
  currentUser,
  onAddToCart,
}: LensConfiguratorModalProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { packages, basePrices, isLoading: isPricingLoading, refresh } = useLensPricing();

  // ─── Step state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 — Contact
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [step1Error, setStep1Error] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);

  // Step 2 — Vision Type
  const [visionType, setVisionType] = useState<VisionType>('standard');

  // Step 3 — Lens Package
  const [selectedLensId, setSelectedLensId] = useState<string>('');

  // Step 4 — Prescription
  const [prescriptionTab, setPrescriptionTab] = useState<PrescriptionTab>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [rxFileUrl, setRxFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message?: string;
  }>({ type: 'idle' });

  // Custom Bottom-Sheet Picker State
  const [activePicker, setActivePicker] = useState<ActivePickerState | null>(null);

  // Manual Rx fields bound to exact clinical ranges
  const [odSph, setOdSph] = useState(DEFAULT_SPH);
  const [odCyl, setOdCyl] = useState(DEFAULT_CYL);
  const [odAxis, setOdAxis] = useState(DEFAULT_AXIS);
  const [osSph, setOsSph] = useState(DEFAULT_SPH);
  const [osCyl, setOsCyl] = useState(DEFAULT_CYL);
  const [osAxis, setOsAxis] = useState(DEFAULT_AXIS);
  const [addPower, setAddPower] = useState(DEFAULT_ADD);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Pre-fill name from authenticated user
  useEffect(() => {
    if (isOpen) {
      refresh();
      if (currentUser?.name) setFullName(currentUser.name);
      if (currentUser?.phone) setWhatsapp(currentUser.phone.replace(/\D/g, '').replace(/^92/, '0'));
    } else {
      // Reset on close
      setStep(1);
      setFullName('');
      setWhatsapp('');
      setStep1Error('');
      setVisionType('standard');
      setSelectedLensId('');
      setPrescriptionTab('upload');
      setUploadedFile(null);
      setUploadedPreviewUrl(null);
      setRxFileUrl(null);
      setIsScanning(false);
      setScanStatus({ type: 'idle' });
      setActivePicker(null);
      setOdSph(DEFAULT_SPH);
      setOdCyl(DEFAULT_CYL);
      setOdAxis(DEFAULT_AXIS);
      setOsSph(DEFAULT_SPH);
      setOsCyl(DEFAULT_CYL);
      setOsAxis(DEFAULT_AXIS);
      setAddPower(DEFAULT_ADD);
      setIsCheckingOut(false);
    }
  }, [isOpen, currentUser, refresh]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-select first lens when packages load
  useEffect(() => {
    if (packages.length > 0 && !selectedLensId) {
      setSelectedLensId(packages[0].id);
    }
  }, [packages, selectedLensId]);

  // If switching to progressive, ensure 1.67 is mapped to valid progressive tier
  useEffect(() => {
    if (visionType === 'progressive' && selectedLensId === 'sv-167-shmc') {
      setSelectedLensId('progressive-freeform');
    }
  }, [visionType, selectedLensId]);

  function parsePowerNum(v: string | number | null | undefined): number {
    const n = parseFloat(String(v || 0));
    return isNaN(n) ? 0 : n;
  }

  // ─── Single Source of Truth for Lens Price via Pricing Engine ─────────────
  const isProgressive = visionType === 'progressive';
  const selectedPackage = packages.find((p) => p.id === selectedLensId);

  const parsedOdSph = parsePowerNum(odSph);
  const parsedOdCyl = parsePowerNum(odCyl);
  const parsedOsSph = parsePowerNum(osSph);
  const parsedOsCyl = parsePowerNum(osCyl);
  const parsedAdd = parsePowerNum(addPower);

  const pricingResult: TotalPricingResult | null = useMemo(() => {
    if (!selectedLensId) return null;
    if (isProgressive) {
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
  }, [isProgressive, selectedLensId, parsedOdSph, parsedOdCyl, parsedOsSph, parsedOsCyl, parsedAdd, basePrices]);

  const fallbackBasePrice = isProgressive
    ? (selectedPackage?.presbyopiaBasePrice ?? 0)
    : (selectedPackage?.standardBasePrice ?? 0);

  const activeLensPrice = pricingResult?.finalPrice ?? fallbackBasePrice;
  const framePrice = frame?.price ?? 0;
  const totalPrice = (framePrice || 0) + (activeLensPrice || 0);

  const selectedLens = useMemo(() => {
    if (!selectedPackage) return null;
    return {
      ...selectedPackage,
      price: activeLensPrice,
      isProgressive,
    };
  }, [selectedPackage, activeLensPrice, isProgressive]);

  if (!isOpen) return null;

  // ─── Step 1 Submit ───────────────────────────────────────────────────────

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');

    const customerName = fullName.trim();
    const rawDigits = whatsapp.replace(/\D/g, '');

    if (!customerName || customerName.length < 2) {
      setStep1Error('Please enter your full name.');
      return;
    }
    if (rawDigits.length < 10) {
      setStep1Error('Please enter a valid WhatsApp/mobile number.');
      return;
    }

    const customerPhone = rawDigits.startsWith('0')
      ? rawDigits
      : (rawDigits.startsWith('92') ? `0${rawDigits.slice(2)}` : `0${rawDigits}`);
    const activeFrameId = frame?.id ? String(frame.id) : undefined;
    const activeFrameName = frame?.name || 'Selected Frame';

    // Store in localStorage for checkout pre-population
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('myeyes_lead_name', customerName);
        localStorage.setItem('myeyes_lead_phone', customerPhone);
        localStorage.setItem('myeyes_lead_frame', activeFrameName);
      }
    } catch { /* storage fallback */ }

    // Dispatch non-blocking lead capture
    setIsSavingLead(true);
    fetch('/api/leads/partial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerName,
        phone: customerPhone,
        frameId: activeFrameId,
        frameName: activeFrameName,
      }),
    }).catch(err => {
      console.warn('Lead capture notice:', err);
    });

    setIsSavingLead(false);
    setStep(2);
  };

  // ─── Prescription Scanner & Upload ───────────────────────────────────────

  const scanPrescriptionSlip = async (file: File) => {
    setIsScanning(true);
    setScanStatus({ type: 'idle' });

    try {
      const formData = new FormData();
      formData.append('slip', file);

      const res = await fetch('/api/prescription/scan', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        if (json.slipUrl && typeof json.slipUrl === 'string') {
          setRxFileUrl(json.slipUrl);
        }

        if (json.data) {
          const { od, os, add } = json.data;

          // Auto-fill right eye
          if (od?.sph && SPH_OPTIONS.includes(od.sph)) setOdSph(od.sph);
          if (od?.cyl && CYL_OPTIONS.includes(od.cyl)) setOdCyl(od.cyl);
          if (od?.axis && AXIS_OPTIONS.includes(od.axis)) setOdAxis(od.axis);

          // Auto-fill left eye
          if (os?.sph && SPH_OPTIONS.includes(os.sph)) setOsSph(os.sph);
          if (os?.cyl && CYL_OPTIONS.includes(os.cyl)) setOsCyl(os.cyl);
          if (os?.axis && AXIS_OPTIONS.includes(os.axis)) setOsAxis(os.axis);

          // Auto-detect ADD power and switch to progressive mode
          if (add && ADD_OPTIONS.includes(add)) {
            setAddPower(add);
            setVisionType('progressive');
          }

          setScanStatus({
            type: 'success',
            message: 'Numbers detected from your slip. Please verify below.',
          });
        } else {
          setScanStatus({
            type: 'success',
            message: 'Prescription slip attached. Please select your power numbers below.',
          });
        }
      } else {
        setScanStatus({
          type: 'error',
          message: 'We could not clearly detect all numbers. Please confirm or adjust them manually below.',
        });
      }
    } catch (err) {
      console.warn('Prescription scan network issue:', err);
      setScanStatus({
        type: 'error',
        message: 'We could not clearly detect all numbers. Please confirm or adjust them manually below.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const uploadStorageFile = async (file: File) => {
    // If we already received Cloudinary slipUrl from scan, skip secondary upload
    if (rxFileUrl && rxFileUrl.includes('cloudinary.com')) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.fileUrl || data.secure_url || null;
        if (url) setRxFileUrl(url);
      }
    } catch { /* ignore storage upload error */ }
    setIsUploading(false);
  };

  // ─── Bottom-Sheet Picker Value Handler ──────────────────────────────────

  const handlePickerChange = (val: string) => {
    if (!activePicker) return;
    const { field } = activePicker;

    switch (field) {
      case 'odSph':
        setOdSph(val);
        break;
      case 'odCyl':
        setOdCyl(val);
        if (val === '0.00') setOdAxis(DEFAULT_AXIS);
        break;
      case 'odAxis':
        setOdAxis(val);
        break;
      case 'osSph':
        setOsSph(val);
        break;
      case 'osCyl':
        setOsCyl(val);
        if (val === '0.00') setOsAxis(DEFAULT_AXIS);
        break;
      case 'osAxis':
        setOsAxis(val);
        break;
      case 'add':
        setAddPower(val);
        break;
    }
  };

  // ─── Checkout handoff ────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      // Ensure slip is uploaded if file is chosen
      let finalRxUrl = rxFileUrl;
      if (uploadedFile && !finalRxUrl) {
        try {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            finalRxUrl = data.url || data.fileUrl || null;
            if (finalRxUrl) setRxFileUrl(finalRxUrl);
          }
        } catch (uploadErr) {
          console.warn('Slip upload issue during checkout:', uploadErr);
        }
      }

      const lensLabel = `${selectedPackage?.name || 'Custom Lens'} (${isProgressive ? 'Progressive' : 'Standard'})`;

      const parseVal = (v: string) => {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
      };
      const parseCyl = (v: string) => {
        const num = parseFloat(v);
        return isNaN(num) || num === 0 ? null : num;
      };

      const prescriptionDetails = {
        odSph: parseVal(odSph),
        odCyl: parseCyl(odCyl),
        odAxis: parseCyl(odCyl) === null ? null : parseInt(odAxis, 10),
        osSph: parseVal(osSph),
        osCyl: parseCyl(osCyl),
        osAxis: parseCyl(osCyl) === null ? null : parseInt(osAxis, 10),
        od: {
          sph: String(odSph || "0.00"),
          cyl: String(odCyl || "0.00"),
          axis: String(odAxis || "180"),
        },
        os: {
          sph: String(osSph || "0.00"),
          cyl: String(osCyl || "0.00"),
          axis: String(osAxis || "180"),
        },
        add: isProgressive ? parseVal(addPower) : null,
        lensUsage: isProgressive ? 'Progressive' : 'Single Vision',
        rxFileUrl: typeof finalRxUrl === 'string' ? finalRxUrl : undefined,
        slipUrl: typeof finalRxUrl === 'string' ? finalRxUrl : null,
        slipName: uploadedFile?.name || null,
      };

      const cartPayload = {
        productId: String(frame.id),
        name: `${frame.name} + ${lensLabel}`,
        price: Number(totalPrice),
        image: frame.imageUrl || '/placeholder-frame.png',
        color: frame.color || undefined,
        prescription: {
          ...prescriptionDetails,
          lensMaterial: String(selectedPackage?.name || ''),
          lensBasePriceKey: String(pricingResult?.basePriceKey || selectedPackage?.code || ''),
          lensBasePriceValue: Number(pricingResult?.basePriceValue || activeLensPrice),
          lensMultiplier: Number(pricingResult?.multiplier || 1),
          lensFinalPrice: Number(activeLensPrice),
          framePrice: Number(frame.price),
          isAsymmetricRx: pricingResult?.isAsymmetricRx,
          rightEyeLensPrice: pricingResult?.rightEyeLensPrice,
          leftEyeLensPrice: pricingResult?.leftEyeLensPrice,
          rightMultiplier: pricingResult?.rightMultiplier,
          leftMultiplier: pricingResult?.leftMultiplier,
        },
      };

      addItem(cartPayload);

      if (onAddToCart) {
        try {
          onAddToCart({
            frame: { id: frame.id, name: frame.name, price: frame.price, imageUrl: frame.imageUrl, color: frame.color },
            visionType,
            selectedLensId,
            selectedLens,
            lensPrice: Number(activeLensPrice),
            totalPrice: Number(totalPrice),
            prescriptionDetails,
            contact: { fullName: fullName.trim(), whatsapp: whatsapp.trim() },
          });
        } catch (cbErr) {
          console.warn('onAddToCart callback error:', cbErr);
        }
      }

      onClose();

      try {
        router.push('/checkout');
      } catch (navErr) {
        console.warn('Router push failed, falling back to window.location:', navErr);
        window.location.href = '/checkout';
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setIsCheckingOut(false);
      try {
        onClose();
        router.push('/checkout');
      } catch {
        window.location.href = '/checkout';
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Shell */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-10 max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Glasses className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black tracking-tight text-amber-600 shrink-0">MY EYES</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  Prescription Eyewear
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {frame.name} — <span className="font-bold text-slate-900">Rs. {frame.price.toLocaleString()}</span>
                {step > 2 && selectedLens && (
                  <> + <span className="font-bold text-amber-600">Rs. {activeLensPrice.toLocaleString()}</span> = <span className="font-extrabold text-slate-900">Rs. {totalPrice.toLocaleString()}</span></>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close configurator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step Progress ── */}
        <div className="px-5 sm:px-6 py-3 shrink-0 bg-slate-50/50 border-b border-slate-100">
          <StepBar current={step} />
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5 pb-safe">

          {/* ═══════════════════════════════════════════════
              STEP 1 — CUSTOMER CONTACT INFORMATION
          ═══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Micro-badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-950 leading-tight">
                    Pakistan&apos;s First Prescription Based Eyewear Store
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Enter your contact details so our lab can craft your personalized lenses.
                  </p>
                </div>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ahmed Khan"
                      className="w-full pl-11 pr-4 py-3.5 min-h-[50px] rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    WhatsApp / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 overflow-hidden transition-all min-h-[50px]">
                    <span className="px-4 py-3.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-700 font-bold flex items-center gap-1.5 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +92
                    </span>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      placeholder="3xx-xxxxxxx"
                      className="flex-1 px-4 py-3.5 text-base text-slate-900 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {step1Error && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                    {step1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-semibold py-4 rounded-xl shadow-md shadow-amber-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingLead ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                  ) : (
                    <><span>Save Frame &amp; Continue</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 2 — VISION TYPE
          ═══════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-slate-900">Choose Vision Type</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select how you&apos;d like your lenses to function.</p>
              </div>

              {/* Standard Vision Card */}
              <button
                type="button"
                onClick={() => setVisionType('standard')}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border transition-all duration-150 cursor-pointer group bg-white',
                  visionType === 'standard'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-amber-400'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      visionType === 'standard' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'
                    )}>
                      <Eye className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900">Standard Vision</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        For driving, distance vision, screen use, or single reading power.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    visionType === 'standard' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  )}>
                    {visionType === 'standard' && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </div>
                </div>
              </button>

              {/* Progressive Card */}
              <button
                type="button"
                onClick={() => setVisionType('progressive')}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border transition-all duration-150 cursor-pointer group bg-white',
                  visionType === 'progressive'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-amber-400'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      visionType === 'progressive' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'
                    )}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-slate-900">Progressive</p>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide">
                          Near &amp; Far
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        Smooth transition between reading, intermediate &amp; distance without changing frames.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    visionType === 'progressive' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  )}>
                    {visionType === 'progressive' && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </div>
                </div>
              </button>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
                >
                  <span>Choose Lenses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 3 — LENS PACKAGES
          ═══════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Lens Package</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {isProgressive ? 'progressive' : 'standard'} options.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  {isProgressive ? 'Progressive / Multi-Focal' : 'Single Vision'}
                </span>
              </div>

              {isPricingLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Loading live prices...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages
                    .filter((pkg) => !(isProgressive && pkg.id === 'sv-167-shmc'))
                    .map((pkg) => {
                      const price = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
                      const isSelected = selectedLensId === pkg.id;
                      const tierMap = isProgressive ? PROGRESSIVE_TIER_INFO : SINGLE_VISION_TIER_INFO;
                      const tierInfo = tierMap[pkg.code];
                      const title = tierInfo?.title || pkg.name;
                      const bullets = tierInfo?.bullets || [];

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedLensId(pkg.id)}
                          className={cn(
                            'w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer group bg-white',
                            isSelected
                              ? 'border-[#ff7a00] bg-orange-50/40 ring-2 ring-[#ff7a00]/20 shadow-xs'
                              : 'border-slate-200 hover:border-orange-300'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Simple Lens Title */}
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                                {title}
                              </h4>

                              {/* Exactly 2 Clean Benefit Bullets */}
                              {bullets.length > 0 && (
                                <ul className="mt-2 space-y-1.5">
                                  {bullets.map((b) => (
                                    <li key={b} className="flex items-start gap-1.5 text-xs text-slate-600">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Price + Selection Indicator */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                isSelected ? 'border-[#ff7a00] bg-[#ff7a00]' : 'border-slate-300'
                              )}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                              </div>
                              <span className="text-sm sm:text-base font-extrabold text-[#ff7a00] whitespace-nowrap">
                                Rs. {price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => { if (selectedLensId) setStep(4); }}
                  disabled={!selectedLensId}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
                >
                  <span>Add Prescription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 4 — PRESCRIPTION + DUAL MOBILE CAPTURE
          ═══════════════════════════════════════════════ */}
          {step === 4 && (
            <Step4Prescription
              frame={frame}
              visionType={visionType}
              setVisionType={setVisionType}
              selectedLens={selectedLens}
              selectedPackage={selectedPackage}
              lensPrice={activeLensPrice}
              totalPrice={totalPrice}
              pricingResult={pricingResult}
              basePrices={basePrices}
              prescriptionTab={prescriptionTab}
              setPrescriptionTab={setPrescriptionTab}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              uploadedPreviewUrl={uploadedPreviewUrl}
              setUploadedPreviewUrl={setUploadedPreviewUrl}
              rxFileUrl={rxFileUrl}
              setRxFileUrl={setRxFileUrl}
              isScanning={isScanning}
              scanStatus={scanStatus}
              scanPrescriptionSlip={scanPrescriptionSlip}
              uploadStorageFile={uploadStorageFile}
              odSph={odSph}
              setOdSph={setOdSph}
              odCyl={odCyl}
              setOdCyl={setOdCyl}
              odAxis={odAxis}
              setOdAxis={setOdAxis}
              osSph={osSph}
              setOsSph={setOsSph}
              osCyl={osCyl}
              setOsCyl={setOsCyl}
              osAxis={osAxis}
              setOsAxis={setOsAxis}
              addPower={addPower}
              setAddPower={setAddPower}
              openPicker={setActivePicker}
              onBack={() => setStep(3)}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
            />
          )}
        </div>
      </div>

      {/* ── Custom Bottom-Sheet Picker Modal ── */}
      {activePicker && (
        <PrescriptionPickerSheet
          isOpen={!!activePicker}
          onClose={() => setActivePicker(null)}
          title={activePicker.title}
          subtitle={activePicker.subtitle}
          options={activePicker.options}
          value={activePicker.value}
          unit={activePicker.unit}
          onChange={handlePickerChange}
        />
      )}
    </div>
  );
}

export const READING_ADD_DIOPTERS = ADD_OPTIONS;

export default LensConfiguratorModal;
