"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  X,
  Home,
  Glasses,
  Sun,
  Percent,
  Sparkles,
  Ruler,
  Camera,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

export interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPDModal?: () => void;
  onOpenTryOnModal?: () => void;
}

export function NavigationSidebar({
  isOpen,
  onClose,
  onOpenPDModal,
  onOpenTryOnModal,
}: NavigationSidebarProps) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex flex-col justify-center">
            <span className="text-base font-extrabold text-[#ff7a00] leading-tight">
              MY EYES
            </span>
            <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
              OPTICAL STUDIO
            </span>
          </div>
          <button
            type="button"
            id="close-sidebar-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Primary Category Links */}
          <div className="space-y-1">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-slate-500" />
                <span>Home</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/eyeglasses"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <Glasses className="w-4 h-4 text-slate-500" />
                <span>Eyeglasses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/sunglasses"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-slate-500" />
                <span>Sunglasses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/lens-pricing"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-slate-500" />
                <span>Lens Pricing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Interactive Studio Tools */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 block">
              Studio Tools
            </span>

            <Link
              href="/quiz"
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 text-amber-900 font-medium hover:bg-amber-100/60 transition shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Style Quiz</span>
                <span className="text-[10px] text-slate-500">Find your ideal shape</span>
              </div>
            </Link>

            <button
              type="button"
              id="sidebar-measure-pd-btn"
              onClick={() => {
                onClose();
                onOpenPDModal?.();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-700 font-medium hover:bg-slate-100 transition text-left cursor-pointer shadow-2xs"
            >
              <Ruler className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Measure PD</span>
                <span className="text-[10px] text-slate-500">Pupillary distance tool</span>
              </div>
            </button>

            <button
              type="button"
              id="sidebar-virtual-tryon-btn"
              onClick={() => {
                onClose();
                onOpenTryOnModal?.();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-700 font-medium hover:border-[#ff7a00] hover:text-[#ff7a00] hover:bg-amber-50/50 transition text-left cursor-pointer shadow-2xs"
            >
              <Camera className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Virtual 3D Try-On</span>
                <span className="text-[10px] text-slate-500">Real-time facial mirror</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Contact */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <a
            href="https://wa.me/923000000000?text=Hi%20MY%20EYES%20Optical%20Studio,%20I%20need%20assistance%20with%20my%20prescription%20glasses."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Optical Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default NavigationSidebar;
