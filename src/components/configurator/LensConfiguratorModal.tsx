'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  ShieldCheck,
  Upload,
  Camera,
  Trash2,
  Loader2,
  ChevronRight,
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
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200',
                current === s.num
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                  : current > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-100 text-neutral-400'
              )}
            >
              {current > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span
              className={cn(
                'text-[11px] font-semibold transition-colors hidden sm:block',
                current === s.num ? 'text-slate-900' : current > s.num ? 'text-emerald-600' : 'text-neutral-400'
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-px transition-colors',
                current > s.num ? 'bg-emerald-400' : 'bg-neutral-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Lens tier features map ──────────────────────────────────────────────────

const TIER_FEATURES: Record<string, string[]> = {
  B1: ['Hard crystal scratch-resistant coating', 'Standard single-vision clarity', 'Ideal for mild prescriptions (0 to ±2.00)', 'Lightest lens option'],
  B2: ['HEV Blue light filter (screens & devices)', '100% UV400 protection', 'HMC anti-reflective multi-coating', 'Best for heavy screen users'],
  B3: ['Photochromic sun-adaptive tinting', 'Auto-darkens in sunlight, clears indoors', '100% UV400 protection + HMC coating', '2-in-1 indoor & outdoor lens'],
  B4: ['Dual blue light + photochromic filter', 'Tints outdoors, shields digitally indoors', 'Super Flat Blue + Photo coating', 'Ultimate hybrid protection'],
  B5: ['1.67 high-index ultra-thin profile', '~35% thinner than standard lenses', 'Super hydrophobic HMC coating', 'Best for strong prescriptions (±3.50+)'],
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
  const { packages, isLoading: isPricingLoading, refresh } = useLensPricing();

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Rx fields bound to exact 0.25 D optical ranges
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

  if (!isOpen) return null;

  // ─── Derived data ────────────────────────────────────────────────────────

  const isProgressive = visionType === 'progressive';
  const selectedPackage = packages.find((p) => p.id === selectedLensId);
  const lensPrice = selectedPackage
    ? (isProgressive ? selectedPackage.presbyopiaBasePrice : selectedPackage.standardBasePrice)
    : 0;
  const totalPrice = frame.price + lensPrice;

  // ─── Step 1 Submit ───────────────────────────────────────────────────────

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');

    const name = fullName.trim();
    const phone = whatsapp.replace(/\D/g, '');

    if (!name || name.length < 2) {
      setStep1Error('Please enter your full name.');
      return;
    }
    if (phone.length < 10) {
      setStep1Error('Please enter a valid WhatsApp/mobile number.');
      return;
    }

    // Fire-and-forget lead capture
    setIsSavingLead(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          whatsapp: phone.startsWith('92') ? phone : `92${phone.startsWith('0') ? phone.slice(1) : phone}`,
          frameId: frame.id,
          frameName: frame.name,
          source: 'configurator',
        }),
      });
    } catch { /* fire-and-forget */ }
    setIsSavingLead(false);

    setStep(2);
  };

  // ─── File upload helpers ─────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedPreviewUrl(url);
    setRxFileUrl(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUploadFile = async () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setRxFileUrl(data.url || data.fileUrl || null);
      }
    } catch { /* ignore upload error */ }
    setIsUploading(false);
  };

  // ─── Checkout handoff ────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    // Ensure slip is uploaded if that tab is active and file is chosen
    if (prescriptionTab === 'upload' && uploadedFile && !rxFileUrl) {
      await handleUploadFile();
    }

    const lensLabel = `${selectedPackage?.name || 'Custom Lens'} (${isProgressive ? 'Progressive' : 'Standard'})`;

    const parseVal = (v: string) => parseFloat(v) || 0;
    const parseCyl = (v: string) => {
      const num = parseFloat(v);
      return isNaN(num) || num === 0 ? null : num;
    };

    const prescriptionDetails = prescriptionTab === 'manual'
      ? {
          odSph: parseVal(odSph),
          odCyl: parseCyl(odCyl),
          odAxis: parseCyl(odCyl) === null ? null : parseInt(odAxis, 10),
          osSph: parseVal(osSph),
          osCyl: parseCyl(osCyl),
          osAxis: parseCyl(osCyl) === null ? null : parseInt(osAxis, 10),
          add: isProgressive ? parseFloat(addPower) : null,
          lensUsage: isProgressive ? 'Progressive' : 'Single Vision',
        }
      : {
          rxFileUrl: rxFileUrl || undefined,
          lensUsage: isProgressive ? 'Progressive' : 'Single Vision',
        };

    const cartPayload = {
      productId: frame.id,
      name: `${frame.name} + ${lensLabel}`,
      price: totalPrice,
      image: frame.imageUrl || '/placeholder-frame.png',
      color: frame.color,
      prescription: {
        ...prescriptionDetails,
        lensMaterial: selectedPackage?.name || '',
        lensBasePriceKey: selectedPackage?.code || '',
        lensBasePriceValue: lensPrice,
        lensFinalPrice: lensPrice,
        framePrice: frame.price,
      },
    };

    addItem(cartPayload);

    if (onAddToCart) {
      onAddToCart({
        frame,
        visionType,
        selectedLensId,
        lensPrice,
        totalPrice,
        prescriptionDetails,
        contact: { fullName: fullName.trim(), whatsapp },
      });
    }

    onClose();
    router.push('/checkout');
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Shell */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-neutral-100 flex flex-col z-10 max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-100 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Glasses className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-amber-600 shrink-0">MY EYES</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  Pakistan&apos;s First Prescription Eyewear
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                {frame.name} — <span className="font-bold text-slate-900">Rs. {frame.price.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close configurator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step Progress ── */}
        <div className="px-5 sm:px-6 pt-3.5 pb-1 shrink-0 bg-white border-b border-neutral-50">
          <StepBar current={step} />
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">

          {/* ═══════════════════════════════════════════════
              STEP 1 — CONTACT INFORMATION
          ═══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Micro-badge */}
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900 leading-tight">
                    Pakistan&apos;s First Prescription Based Eyewear Store
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                    Enter your details so we can prepare your prescription lenses.
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
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ahmed Khan"
                      className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-neutral-200 text-sm text-slate-900 placeholder:text-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    WhatsApp / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-2xl border border-neutral-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 overflow-hidden transition-all min-h-[48px]">
                    <span className="px-3.5 py-3.5 bg-neutral-50 border-r border-neutral-200 text-xs text-slate-600 font-bold flex items-center gap-1 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      +92
                    </span>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      placeholder="3xx-xxxxxxx"
                      className="flex-1 px-3.5 py-3 text-sm text-slate-900 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {step1Error && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {step1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
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
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Choose Vision Type</h3>
                <p className="text-xs text-neutral-500 mt-1">Select how you&apos;d like your lenses to work.</p>
              </div>

              {/* Standard Vision Card */}
              <button
                type="button"
                onClick={() => setVisionType('standard')}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer group',
                  visionType === 'standard'
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      visionType === 'standard' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-amber-100 group-hover:text-amber-600'
                    )}>
                      <Eye className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Standard Vision</p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                        For driving, walking, daily wear, or reading. Single focal power.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    visionType === 'standard' ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'
                  )}>
                    {visionType === 'standard' && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>

              {/* Progressive Card */}
              <button
                type="button"
                onClick={() => setVisionType('progressive')}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer group',
                  visionType === 'progressive'
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      visionType === 'progressive' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-amber-100 group-hover:text-amber-600'
                    )}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">Progressive</p>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide">
                          Near &amp; Far
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                        Near &amp; far view without switching glasses. Seamless multi-focal.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    visionType === 'progressive' ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'
                  )}>
                    {visionType === 'progressive' && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>

              {/* Nav */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-slate-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lens Package</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Showing {isProgressive ? 'progressive' : 'standard'} prices.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                  {isProgressive ? 'Progressive / Multi-Focal' : 'Single Vision'}
                </span>
              </div>

              {isPricingLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-neutral-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Loading live prices...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => {
                    const price = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
                    const isSelected = selectedLensId === pkg.id;
                    const features = TIER_FEATURES[pkg.code] || [];

                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedLensId(pkg.id)}
                        className={cn(
                          'w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer group',
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                            : 'border-neutral-200 bg-white hover:border-amber-300'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Tier code + name */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                'text-[10px] font-black px-2 py-0.5 rounded-full transition-colors',
                                isSelected ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 group-hover:bg-amber-100 group-hover:text-amber-700'
                              )}>
                                {pkg.code}
                              </span>
                              <span className="text-xs font-bold text-slate-900 leading-tight">
                                {pkg.name}
                              </span>
                            </div>

                            {/* Feature bullets */}
                            {features.length > 0 && (
                              <ul className="mt-2 space-y-0.5">
                                {features.map((f) => (
                                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-neutral-600">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Price + selection indicator */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm font-black text-amber-600 whitespace-nowrap">
                              Rs. {price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Nav */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-slate-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => { if (selectedLensId) setStep(4); }}
                  disabled={!selectedLensId}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
                >
                  <span>Add Prescription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 4 — PRESCRIPTION + CHECKOUT
          ═══════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Prescription Details</h3>
                <p className="text-xs text-neutral-500 mt-1">Upload your doctor&apos;s slip or enter numbers manually.</p>
              </div>

              {/* Tab Switch */}
              <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrescriptionTab('upload')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    prescriptionTab === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-neutral-500 hover:text-slate-700'
                  )}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Upload Slip
                </button>
                <button
                  type="button"
                  onClick={() => setPrescriptionTab('manual')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    prescriptionTab === 'manual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-neutral-500 hover:text-slate-700'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Enter Numbers
                </button>
              </div>

              {/* Upload Tab */}
              {prescriptionTab === 'upload' && (
                <div className="space-y-3">
                  {uploadedPreviewUrl ? (
                    <div className="relative rounded-2xl border-2 border-amber-300 bg-amber-50/30 overflow-hidden">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={uploadedPreviewUrl}
                          alt="Prescription slip preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-amber-200/50">
                        <span className="text-[11px] font-semibold text-amber-800 truncate max-w-[200px]">
                          {uploadedFile?.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadedPreviewUrl(null);
                            setRxFileUrl(null);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {rxFileUrl && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-t border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">Slip uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
                        isDragging
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-neutral-200 hover:border-amber-400 hover:bg-amber-50/30'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
                        isDragging ? 'bg-amber-100' : 'bg-neutral-100'
                      )}>
                        <Upload className={cn('w-6 h-6', isDragging ? 'text-amber-600' : 'text-neutral-400')} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">Drop slip here or tap to browse</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Take a photo or upload JPG/PNG</p>
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold">
                        Choose File
                      </span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              )}

              {/* Manual Entry Tab */}
              {prescriptionTab === 'manual' && (
                <div className="space-y-4">
                  {(['OD (Right Eye)', 'OS (Left Eye)'] as const).map((label, eyeIndex) => {
                    const isRight = eyeIndex === 0;
                    const sph = isRight ? odSph : osSph;
                    const cyl = isRight ? odCyl : osCyl;
                    const axis = isRight ? odAxis : osAxis;
                    const setSph = isRight ? setOdSph : setOsSph;
                    const setCyl = isRight ? setOdCyl : setOsCyl;
                    const setAxis = isRight ? setOdAxis : setOsAxis;

                    return (
                      <div key={label} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                        <p className="text-xs font-bold text-slate-900">{label}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {/* SPH */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">SPH</label>
                            <select
                              value={sph}
                              onChange={(e) => setSph(e.target.value)}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none cursor-pointer"
                            >
                              {SPH_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                          {/* CYL */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">CYL</label>
                            <select
                              value={cyl}
                              onChange={(e) => {
                                setCyl(e.target.value);
                                if (e.target.value === '0.00') setAxis(DEFAULT_AXIS);
                              }}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none cursor-pointer"
                            >
                              {CYL_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                          {/* AXIS */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">AXIS</label>
                            <select
                              value={axis}
                              onChange={(e) => setAxis(e.target.value)}
                              disabled={cyl === '0.00'}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none cursor-pointer disabled:opacity-40"
                            >
                              {AXIS_OPTIONS.map((v) => <option key={v} value={v}>{v}°</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ADD field for progressive */}
                  {isProgressive && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                      <p className="text-xs font-bold text-amber-900">ADD Power (Reading Addition)</p>
                      <select
                        value={addPower}
                        onChange={(e) => setAddPower(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none cursor-pointer"
                      >
                        {ADD_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* ── Live Summary Bar (Warm Amber Theme) ── */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-slate-800 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Order Summary</p>

                {/* Frame thumbnail + name */}
                <div className="flex items-center gap-3">
                  {frame.imageUrl && (
                    <div className="w-12 h-10 rounded-lg bg-white border border-amber-200/80 overflow-hidden shrink-0 relative">
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
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Rs. {frame.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t border-amber-200/60 pt-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Lens Tier</span>
                    <span className="font-bold text-amber-700 text-right max-w-[200px] truncate">
                      {selectedPackage?.code} — {selectedPackage?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Vision Mode</span>
                    <span className="font-bold text-slate-900 capitalize">{visionType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Lens Price</span>
                    <span className="font-bold text-slate-900">Rs. {lensPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-amber-200/80">
                    <span className="text-sm font-bold text-slate-900">Total Price</span>
                    <span className="text-amber-600 font-bold text-xl">Rs. {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-slate-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /><span>Proceed to Checkout</span><ChevronRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const READING_ADD_DIOPTERS = ADD_OPTIONS;

export default LensConfiguratorModal;
