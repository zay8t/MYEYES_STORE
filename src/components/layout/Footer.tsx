"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Truck,
  Eye,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { useIsStandalone } from "@/hooks/useIsStandalone";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Footer() {
  const isStandalone = useIsStandalone();
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instruction
      alert("To install MyEyes on Android/iOS, tap your browser's share/options menu and select 'Add to Home screen' or 'Install App'.");
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-800 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="My Eyes Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider text-[#ff7a00] uppercase group-hover:text-amber-600 transition-colors">
                  MY EYES
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Pakistan&apos;s First Prescription-Based Online Eyewear Store. Custom lab-fitted single vision, blue-light blocking, and progressive lenses delivered with precision optics across Pakistan.
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Prescription Accuracy Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#ff7a00] shrink-0" />
                <span>Nationwide Express Safe Delivery</span>
              </div>
            </div>
          </div>

          {/* Column 2: Shop & Collections */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Shop & Collections
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-slate-600">
              <li>
                <Link href="/eyeglasses" className="hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
                  Prescription Eyeglasses
                </Link>
              </li>
              <li>
                <Link href="/sunglasses" className="hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
                  UV400 Polarized Sunglasses
                </Link>
              </li>
              <li>
                <Link href="/eyeglasses?feature=bluecut" className="hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
                  Blue-Cut Computer Lenses
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
                  Progressive & Bi-Focal Lenses
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
                  New Season Arrivals
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-[#ff7a00] font-bold text-amber-600 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  60-Second Frame Style Quiz
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Guides */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Customer Care & Guides
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-slate-600">
              <li>
                <Link href="/quiz" className="hover:text-[#ff7a00] transition-colors">
                  How to Measure Pupillary Distance (PD)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#ff7a00] transition-colors">
                  Prescription & Lens Pricing Guide
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#ff7a00] transition-colors">
                  Track Live Order Status
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-[#ff7a00] transition-colors">
                  EasyPaisa & Bank Transfer Verification
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/923006694928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 font-semibold text-slate-700"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Optometrist WhatsApp Support
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: App Download Module (Web-Only) or App VIP Support (Standalone-Only) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              {mounted && isStandalone ? "App VIP Concierge" : "Get the MyEyes App"}
            </h3>

            {mounted && isStandalone ? (
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                    <Image
                      src="/pwa-192x192.png"
                      alt="MyEyes Icon"
                      width={32}
                      height={32}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">MyEyes App Active</h4>
                    <p className="text-[11px] text-slate-500">Live cloud sync & instant tracking enabled</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/923006694928?text=Hi%20MyEyes%20Optical%2C%20I%27m%20using%20the%20installed%20app%20and%20need%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Optical Support</span>
                </a>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    <Image
                      src="/pwa-192x192.png"
                      alt="MyEyes Icon"
                      width={32}
                      height={32}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">MyEyes for Android</h4>
                    <p className="text-[11px] text-slate-500">1-tap ordering, 3D try-on previews & instant live tracking.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {/* Action 1: Install Web App */}
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#ff7a00] hover:bg-[#e56e00] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Install App</span>
                  </button>

                  {/* Action 2: Download APK */}
                  <a
                    href="/myeyes.apk"
                    download="MyEyes.apk"
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Get APK</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="border-t border-slate-100 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} MyEyes Optical Studio. All rights reserved.</p>
          <p className="text-slate-500 font-medium text-center md:text-right">
            Delivering lab-precision eyewear across Pakistan.
          </p>
        </div>
      </div>
    </footer>
  );
}
