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
  // Lock body scroll with scrollbar compensation
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

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
    >
      {/* Smooth Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <aside
        className={`relative w-full max-w-[300px] sm:max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <Link className="flex items-center gap-2 group transition" href="/" onClick={onClose}>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-[#ff7a00] leading-none">
                MY EYES
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
                OPTICAL STUDIO
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Section 1: Main Categories */}
          <nav aria-label="Main Navigation" className="space-y-1">
            <Link
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer"
              href="/"
              onClick={onClose}
            >
              <div className="flex items-center gap-3.5">
                <Home className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Home</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </Link>

            <Link
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer"
              href="/eyeglasses"
              onClick={onClose}
            >
              <div className="flex items-center gap-3.5">
                <Glasses className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Eyeglasses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </Link>

            <Link
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer"
              href="/sunglasses"
              onClick={onClose}
            >
              <div className="flex items-center gap-3.5">
                <Sun className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Sunglasses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </Link>

            <Link
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer"
              href="/lens-pricing"
              onClick={onClose}
            >
              <div className="flex items-center gap-3.5">
                <Percent className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Lens Pricing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </Link>
          </nav>

          {/* Section 2: Studio Tools */}
          <div className="space-y-1 pt-3 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 select-none">
              Studio Tools
            </span>

            <Link
              className="flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer"
              href="/quiz"
              onClick={onClose}
            >
              <div className="flex items-center gap-3.5">
                <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Style Quiz</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </Link>

            <button
              type="button"
              id="sidebar-measure-pd-btn"
              onClick={() => {
                onClose();
                onOpenPDModal?.();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <Ruler className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Measure PD</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </button>

            <button
              type="button"
              id="sidebar-virtual-tryon-btn"
              onClick={() => {
                onClose();
                onOpenTryOnModal?.();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-800 hover:text-[#ff7a00] hover:bg-amber-50/50 active:bg-amber-100/60 transition group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <Camera className="w-4 h-4 text-slate-500 group-hover:text-[#ff7a00] transition-colors" />
                <span className="text-sm font-medium">Virtual 3D Try-On</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] transition-colors" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default NavigationSidebar;
