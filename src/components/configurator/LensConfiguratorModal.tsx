'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  Lock,
  ArrowRight,
  ChevronRight,
  LogIn,
  Glasses,
  Check,
  UserCheck,
  Edit2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export interface FrameDetails {
  id: string;
  name: string;
  price: number;
  sku?: string;
  imageUrl?: string;
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
  age: number;
  needsReadingLenses: boolean;
  addPower?: string | null;
}

export const READING_ADD_DIOPTERS = [
  '+0.50',
  '+0.75',
  '+1.00',
  '+1.25',
  '+1.50',
  '+1.75',
  '+2.00',
  '+2.25',
  '+2.50',
  '+2.75',
  '+3.00',
];

export const CLINICAL_ADD_DIOPTERS = READING_ADD_DIOPTERS;

export function LensConfiguratorModal({
  isOpen,
  onClose,
  frame,
  currentUser,
  onAddToCart,
}: LensConfiguratorModalProps) {
  // Global auth hook
  const { user: authUser, refetch: refetchAuth } = useAuth();

  // Strict sessionUser resolution: prioritize currentUser prop if valid ID & phone, else authUser if valid ID & phone
  const sessionUser: UserSessionProfile | null = (currentUser?.id && currentUser?.phone)
    ? currentUser
    : (authUser?.id && authUser?.phone
      ? {
          id: authUser.id,
          name: authUser.name,
          phone: authUser.phone,
          age: authUser.age,
          addPower: authUser.addPower,
        }
      : null);

  // Authenticated session detection strictly relies on immutable unique identifiers
  const isAuthenticated = Boolean(sessionUser?.id && sessionUser?.phone);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSignInView, setIsSignInView] = useState(false);

  // Step 1: Distinct Guest State (isolated — keystrokes never mutate session or auth state)
  const [guestFullName, setGuestFullName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestWhatsapp, setGuestWhatsapp] = useState('');

  // Step 1: Logged-in User Age (editable if not on profile or to update)
  const [loggedInAge, setLoggedInAge] = useState('');

  // Common lens preference state for age >= 40
  const [needsReadingLenses, setNeedsReadingLenses] = useState(false);
  const [addPowerValue, setAddPowerValue] = useState('+1.50');

  // Step 1: Sign-In State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Routing & Selection State
  const [patientProfile, setPatientProfile] = useState<CustomerProfile | null>(null);
  const [isPresbyopiaCatalog, setIsPresbyopiaCatalog] = useState(false);
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);

  // Active age for dynamic reading diopter toggle
  const activeAge = isAuthenticated ? parseInt(loggedInAge, 10) : parseInt(guestAge, 10);
  const showReadingPowerPrompt = !isNaN(activeAge) && activeAge >= 40;

  // Sync state when modal opens or auth/session changes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMessage('');

      if (isAuthenticated && sessionUser) {
        if (sessionUser.age) {
          setLoggedInAge(String(sessionUser.age));
        }
        if (sessionUser.addPower && parseFloat(sessionUser.addPower) >= 0.5) {
          setNeedsReadingLenses(true);
          setAddPowerValue(sessionUser.addPower);
        }
      } else {
        setGuestFullName('');
        setGuestAge('');
        setGuestWhatsapp('');
        setLoggedInAge('');
        setNeedsReadingLenses(false);
        setAddPowerValue('+1.50');
      }
    } else {
      document.body.style.overflow = 'unset';
      setCurrentStep(1);
      setIsSignInView(false);
      setErrorMessage('');
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isAuthenticated, sessionUser]);

  if (!isOpen) return null;

  // Sanitize phone numbers for auth
  const sanitizePhoneNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith('0') && digits.length === 11) {
      return '92' + digits.slice(1);
    }
    if (digits.length === 10) {
      return '92' + digits;
    }
    return digits;
  };

  // Handle Form Submission for Step 1
  const handleProceedToLenses = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const resolvedName = isAuthenticated ? sessionUser?.name || '' : guestFullName.trim();
    const resolvedPhone = isAuthenticated
      ? (sessionUser?.phone ? sessionUser.phone.replace(/\D/g, '') : '')
      : guestWhatsapp.trim();
    const resolvedAge = isAuthenticated ? parseInt(loggedInAge, 10) : parseInt(guestAge, 10);

    if (!resolvedName) {
      setErrorMessage('Please provide your full name.');
      return;
    }

    if (isNaN(resolvedAge) || resolvedAge < 5 || resolvedAge > 120) {
      setErrorMessage('Please enter a valid age to tailor your lenses.');
      return;
    }

    if (!isAuthenticated && (!resolvedPhone || resolvedPhone.length < 10)) {
      setErrorMessage('Please provide a valid WhatsApp number for order updates.');
      return;
    }

    const isPresbyopia = resolvedAge >= 40 && needsReadingLenses;

    setPatientProfile({
      fullName: resolvedName,
      whatsapp: resolvedPhone,
      age: resolvedAge,
      needsReadingLenses: isPresbyopia,
      addPower: isPresbyopia ? addPowerValue : undefined,
    });

    setIsPresbyopiaCatalog(isPresbyopia);
    setSelectedLensId(isPresbyopia ? 'progressive_hd' : 'single_vision_blue');
    setCurrentStep(2);
  };

  // Handle Sign-In Submission
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSigningIn(true);

    const cleanIdentifier = sanitizePhoneNumber(loginPhone);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        await refetchAuth();
        setIsSignInView(false);
      } else {
        setErrorMessage(
          data.error || 'No account found with this WhatsApp number. Please check your number or password.'
        );
      }
    } catch {
      setErrorMessage('Connection error. Please check your internet and try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Modal Container: Responsive Bottom Sheet on mobile (max-h-[90dvh], pb-6), centered card on desktop */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-10 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 ease-out max-h-[90dvh] sm:max-h-[92vh] overflow-hidden">

        {/* Header Bar: Fixed/Sticky at top so keyboard never pushes it off-screen */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-8 py-3.5 sm:py-4 shrink-0 bg-white z-20">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-[#ff7a00]/25 flex items-center justify-center text-[#ff7a00] shrink-0">
              <Glasses className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-[#ff7a00] leading-none shrink-0">
                  MY EYES
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  STUDIO CONFIGURATOR
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 truncate max-w-[200px] sm:max-w-none">
                Selected Frame: <span className="font-semibold text-slate-900">{frame.name}</span> (Rs. {frame.price.toLocaleString()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Container with safe area bottom padding */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5 pb-6 sm:pb-8 overscroll-contain">

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between text-xs px-1 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  currentStep === 1
                    ? 'bg-[#ff7a00] text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span className={`font-semibold ${currentStep === 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                Your Info
              </span>
            </div>

            <div className={`flex-1 h-px mx-3 transition-colors ${currentStep > 1 ? 'bg-emerald-400' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  currentStep === 2
                    ? 'bg-[#ff7a00] text-white shadow-xs'
                    : currentStep > 2
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span className={`font-semibold ${currentStep === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                Choose Lenses
              </span>
            </div>

            <div className={`flex-1 h-px mx-3 transition-colors ${currentStep > 2 ? 'bg-emerald-400' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  currentStep === 3
                    ? 'bg-[#ff7a00] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className={`font-semibold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                Prescription
              </span>
            </div>
          </div>

          {/* STEP 1: YOUR INFO (AUTHENTICATED FLOW / GUEST FLOW / SIGN-IN) */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Header / Subtitle + Sign-in Switcher */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
                    {isSignInView ? 'Sign In' : isAuthenticated ? 'Your Profile' : 'Your Info'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {isSignInView
                      ? 'Sign in to access your saved optical account.'
                      : 'Quick details so we can match the right lenses for you.'}
                  </p>
                </div>

                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignInView(!isSignInView);
                      setErrorMessage('');
                    }}
                    className="text-[11px] sm:text-xs font-semibold text-[#ff7a00] hover:text-[#e06c00] flex items-center gap-1 transition cursor-pointer hover:underline shrink-0 pt-0.5 whitespace-nowrap"
                  >
                    {isSignInView ? (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>Guest Checkout</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Already have an account? Sign In</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
                  {errorMessage}
                </div>
              )}

              {/* LOGGED-IN USER VIEW: Clean personalized card with ZERO phone displayed */}
              {isAuthenticated && !isSignInView ? (
                <form onSubmit={handleProceedToLenses} className="space-y-4">
                  {/* Personalized Greeting Card (Displays ONLY Customer Name) */}
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

                  {/* Age Input for Instant Routing */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Your Age * <span className="text-slate-400 font-normal">(determines single-vision vs progressive options)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        required
                        min="5"
                        max="120"
                        value={loggedInAge}
                        onChange={(e) => setLoggedInAge(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Dynamic Reading Prompt for Age 40+ */}
                  {showReadingPowerPrompt && (
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

                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              !needsReadingLenses
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                              needsReadingLenses
                                ? 'bg-[#ff7a00] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
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
                            onChange={(e) => setAddPowerValue(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 focus:outline-none cursor-pointer"
                          >
                            {READING_ADD_DIOPTERS.map((diopter) => (
                              <option key={diopter} value={diopter}>
                                {diopter}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 min-h-[48px] rounded-2xl bg-[#ff7a00] hover:bg-[#e06c00] text-white font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer mt-2"
                  >
                    <span>Proceed to Choose Lenses</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </form>
              ) : !isSignInView ? (
                /* GUEST FORM (NO FORCED ACCOUNT / PASSWORD) */
                <form onSubmit={handleProceedToLenses} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={guestFullName}
                        onChange={(e) => setGuestFullName(e.target.value)}
                        placeholder="e.g. Ahmed Khan"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Age * <span className="text-slate-400 font-normal">(tailors lenses)</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          required
                          min="5"
                          max="120"
                          value={guestAge}
                          onChange={(e) => setGuestAge(e.target.value)}
                          placeholder="e.g. 42"
                          className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        WhatsApp Number *
                      </label>
                      <div className="flex items-center rounded-2xl border border-slate-200 focus-within:border-[#ff7a00] focus-within:ring-4 focus-within:ring-[#ff7a00]/10 overflow-hidden transition-all duration-150 min-h-[48px]">
                        <span className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-600 font-semibold flex items-center gap-1 shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          +92
                        </span>
                        <input
                          type="tel"
                          required
                          value={guestWhatsapp}
                          onChange={(e) => setGuestWhatsapp(e.target.value.replace(/\D/g, ''))}
                          placeholder="3xx-xxxxxxx"
                          className="flex-1 px-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Smart Reading Power Prompt for Age >= 40 */}
                  {showReadingPowerPrompt && (
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

                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              !needsReadingLenses
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setNeedsReadingLenses(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                              needsReadingLenses
                                ? 'bg-[#ff7a00] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
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
                            onChange={(e) => setAddPowerValue(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 focus:outline-none cursor-pointer"
                          >
                            {READING_ADD_DIOPTERS.map((diopter) => (
                              <option key={diopter} value={diopter}>
                                {diopter}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 min-h-[48px] rounded-2xl bg-[#ff7a00] hover:bg-[#e06c00] text-white font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer mt-2"
                  >
                    <span>Choose Lenses</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </form>
              ) : (
                /* RETURNING USER SIGN IN (WhatsApp Number + Password, no email jargon) */
                <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Registered WhatsApp Number
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-200 focus-within:border-[#ff7a00] focus-within:ring-4 focus-within:ring-[#ff7a00]/10 overflow-hidden transition-all duration-150 min-h-[48px]">
                      <span className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 text-xs text-slate-600 font-semibold flex items-center gap-1 shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        +92
                      </span>
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="3xx-xxxxxxx"
                        className="flex-1 px-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3.5 min-h-[48px] rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 focus:outline-none transition-all duration-150"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full py-3.5 px-6 min-h-[48px] rounded-2xl bg-[#ff7a00] hover:bg-[#e06c00] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer mt-2"
                  >
                    {isSigningIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In & Continue</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: CHOOSE LENSES (PROGRESSIVE VS SINGLE-VISION ROUTING) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Identity Card: Displays Customer Name ONLY (no phone number) */}
              {patientProfile && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ff7a00] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {isAuthenticated ? `Logged in as ${patientProfile.fullName}` : `Profile: ${patientProfile.fullName}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Age: {patientProfile.age} yrs {patientProfile.needsReadingLenses ? `| Reading ADD: ${patientProfile.addPower}` : '| Single-Vision'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-[#ff7a00]" />
                    <span>Edit</span>
                  </button>
                </div>
              )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isPresbyopiaCatalog
                    ? 'Progressive & Multi-Focal Lenses'
                    : 'Standard Single-Vision Lenses'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPresbyopiaCatalog
                    ? 'Seamless multi-distance vision for distance, computer screens, and reading.'
                    : 'High-clarity lenses for clear distance or single-power vision.'}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[#ff7a00] text-[11px] font-bold shrink-0">
                {isPresbyopiaCatalog ? 'Progressive & Multi-Focal' : 'Single-Vision Lenses'}
              </span>
            </div>

            {/* Lens Catalog Options (100% PRESERVED NAMES, SKUs & PKR PRICES) */}
            <div className="grid grid-cols-1 gap-3">
              {isPresbyopiaCatalog ? (
                <>
                  <div
                    onClick={() => setSelectedLensId('progressive_std')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      selectedLensId === 'progressive_std'
                        ? 'border-[#ff7a00] bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Digital Freeform Progressive (Standard Corridor)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Smooth transition between distance, screen, and reading zones.
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap pl-3">
                      Rs. 6,500
                    </span>
                  </div>

                  <div
                    onClick={() => setSelectedLensId('progressive_hd')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      selectedLensId === 'progressive_hd'
                        ? 'border-[#ff7a00] bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Ultra-Wide Corridor HD Progressive (Blue Filter)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Maximum reading corridor with minimal peripheral swim distortion.
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#ff7a00] whitespace-nowrap pl-3">
                      Rs. 9,500
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    onClick={() => setSelectedLensId('single_vision_ar')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      selectedLensId === 'single_vision_ar'
                        ? 'border-[#ff7a00] bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Standard Anti-Glare 1.56
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Clean multi-coated lenses with scratch-resistant surface.
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap pl-3">
                      Rs. 2,000
                    </span>
                  </div>

                  <div
                    onClick={() => setSelectedLensId('single_vision_blue')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                      selectedLensId === 'single_vision_blue'
                        ? 'border-[#ff7a00] bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Blue Light Shield 1.61 (High Index)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cuts 95% of digital screen glare with 100% UV400 protection.
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#ff7a00] whitespace-nowrap pl-3">
                      Rs. 3,500
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Back to Info
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#ff7a00] hover:bg-[#e06c00] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
              >
                <span>Next: Prescription</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRESCRIPTION & ORDER CONFIRMATION */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Prescription</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review your order details before adding to cart.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-900">{patientProfile?.fullName} ({patientProfile?.age} yrs)</span>
              </div>
              {patientProfile?.addPower && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reading Addition (+ADD):</span>
                  <span className="font-semibold text-slate-900">{patientProfile.addPower}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Lens Type:</span>
                <span className="font-bold text-[#ff7a00]">
                  {isPresbyopiaCatalog ? 'Progressive & Multi-Focal Lenses' : 'Standard Single-Vision Lenses'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Back to Lenses
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToCart?.({
                    frame,
                    patientProfile,
                    isPresbyopiaCatalog,
                    selectedLensId,
                  });
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#ff7a00] hover:bg-[#e06c00] text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
              >
                Add to Cart & Finalize Order
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default LensConfiguratorModal;
