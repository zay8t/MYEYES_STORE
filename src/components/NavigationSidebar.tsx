"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  Glasses,
  Sun,
  Tag,
  ChevronDown,
  Sparkles,
  Ruler,
  Camera,
  Package,
  FileText,
  Phone,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPDModal: () => void;
  onOpenTryOnModal: () => void;
}

const EYEGLASSES_LINKS = [
  { label: "All Eyeglasses", href: "/eyeglasses" },
  { label: "Men's Eyeglasses", href: "/eyeglasses?gender=Men" },
  { label: "Women's Eyeglasses", href: "/eyeglasses?gender=Women" },
  { label: "Kids' Eyeglasses", href: "/eyeglasses?gender=Kids" },
];

const SUNGLASSES_LINKS = [
  { label: "All Sunglasses", href: "/sunglasses" },
  { label: "Men's Sunglasses", href: "/sunglasses?gender=Men" },
  { label: "Women's Sunglasses", href: "/sunglasses?gender=Women" },
  { label: "Kids' Sunglasses", href: "/sunglasses?gender=Kids" },
];

const COLLECTIONS_LINKS = [
  { label: "Men's Optical Collection", href: "/men" },
  { label: "Women's Optical Collection", href: "/women" },
  { label: "Kids' Optical Collection", href: "/kids" },
];

export default function NavigationSidebar({
  isOpen,
  onClose,
  onOpenPDModal,
  onOpenTryOnModal,
}: NavigationSidebarProps) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<
    "eyeglasses" | "sunglasses" | "collections" | null
  >(null);

  // Close sidebar on path change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open
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

  const toggleSection = (section: "eyeglasses" | "sunglasses" | "collections") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden border-r border-slate-100"
            aria-label="Navigation Menu"
          >
            {/* Header: Brand + Close Button */}
            <div className="h-16 sm:h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2.5 group cursor-pointer"
                aria-label="My Eyes Home"
              >
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="My Eyes Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
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

              <button
                type="button"
                id="close-sidebar-btn"
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
              {/* Section 1: Categories & Collections */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block mb-3">
                  Collections &amp; Categories
                </span>

                {/* Home */}
                <Link
                  href="/"
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors",
                    pathname === "/"
                      ? "bg-amber-50 text-amber-950 border border-amber-200/50"
                      : "text-slate-800 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Home Studio</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                </Link>

                {/* Eyeglasses Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("eyeglasses")}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer text-left",
                      pathname.startsWith("/eyeglasses")
                        ? "bg-amber-50/60 text-amber-950"
                        : "text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Glasses className="w-4 h-4 text-slate-500" />
                      <span>Eyeglasses</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        expandedSection === "eyeglasses" && "rotate-180 text-slate-700"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSection === "eyeglasses" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-10 pr-2 pt-1 pb-2 space-y-1"
                      >
                        {EYEGLASSES_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "block px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                              pathname === item.href
                                ? "text-[#ff7a00] font-bold bg-orange-50/60"
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sunglasses Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("sunglasses")}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer text-left",
                      pathname.startsWith("/sunglasses")
                        ? "bg-amber-50/60 text-amber-950"
                        : "text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-slate-500" />
                      <span>Sunglasses</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        expandedSection === "sunglasses" && "rotate-180 text-slate-700"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSection === "sunglasses" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-10 pr-2 pt-1 pb-2 space-y-1"
                      >
                        {SUNGLASSES_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "block px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                              pathname === item.href
                                ? "text-[#ff7a00] font-bold bg-orange-50/60"
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Collections Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("collections")}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer text-left",
                      pathname.startsWith("/men") ||
                        pathname.startsWith("/women") ||
                        pathname.startsWith("/kids")
                        ? "bg-amber-50/60 text-amber-950"
                        : "text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span>Gender Collections</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        expandedSection === "collections" && "rotate-180 text-slate-700"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSection === "collections" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-10 pr-2 pt-1 pb-2 space-y-1"
                      >
                        {COLLECTIONS_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "block px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                              pathname === item.href
                                ? "text-[#ff7a00] font-bold bg-orange-50/60"
                                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Lens Pricing */}
                <Link
                  href="/lens-pricing"
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors",
                    pathname.startsWith("/lens-pricing") || pathname === "/pricing"
                      ? "bg-amber-50 text-amber-950 border border-amber-200/50"
                      : "text-slate-800 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Percent className="w-4 h-4 text-slate-500" />
                    <span>Lens Pricing &amp; Packages</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                </Link>
              </div>

              {/* Section 2: Interactive Studio Tools */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block">
                  Interactive Studio Tools
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Style Quiz */}
                  <Link
                    href="/quiz"
                    onClick={onClose}
                    className="p-3.5 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/60 to-orange-50/40 hover:from-amber-100/70 hover:to-orange-100/50 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-300/60 flex items-center justify-center text-[#ff7a00]">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Style &amp; Fit Quiz
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Find your ideal shape in 60s
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Measure PD */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPDModal();
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#ff7a00] hover:bg-amber-50/30 transition-all flex items-center justify-between group shadow-2xs text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#ff7a00] group-hover:bg-amber-50 transition-colors">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Measure Pupillary Distance
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Sub-millimetre optical camera tool
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Virtual 3D Try-On */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTryOnModal();
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#ff7a00] hover:bg-amber-50/30 transition-all flex items-center justify-between group shadow-2xs text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#ff7a00] group-hover:bg-amber-50 transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Virtual 3D Try-On
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Real-time 3D facial mirror
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00] group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>

              {/* Section 3: Customer Care & Support */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block mb-3">
                  Customer Care &amp; Support
                </span>

                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>Track Order Status</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                </Link>

                <Link
                  href="/lens-pricing"
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Prescription &amp; Lens Guide</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                </Link>

                <a
                  href="https://wa.me/923000000000?text=Hi%20MY%20EYES%20Optical%20Studio,%20I%20need%20assistance%20with%20my%20prescription%20glasses."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">WhatsApp Optical Support</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Direct
                  </span>
                </a>
              </div>
            </div>

            {/* Footer Assurance Banner */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Optical Lab Guarantee</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                MY EYES STUDIO
              </span>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
