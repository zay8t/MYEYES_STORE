"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, MessageSquare } from "lucide-react";
import GeminiFrameStylist from "@/components/ai/GeminiFrameStylist";

export default function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-stylist", handleOpen);
    return () => window.removeEventListener("open-ai-stylist", handleOpen);
  }, []);

  if (!mounted) return null;

  // Do not display on administrative or checkout pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  return (
    <>
      {/* Floating launcher trigger */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open MY EYES AI Assistant"
          className="group relative flex items-center gap-2.5 px-3.5 py-3 md:px-4 md:py-3.5 rounded-full bg-slate-900 text-white shadow-xl hover:shadow-amber-500/25 hover:bg-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 border border-amber-400/40 cursor-pointer"
        >
          {/* Subtle glowing ambient pulse */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 opacity-30 blur-xs group-hover:opacity-60 transition duration-300 animate-pulse pointer-events-none" />

          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white shadow-xs">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>

          <div className="relative hidden sm:flex flex-col items-start leading-none pr-1">
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-400">
              AI Stylist
            </span>
            <span className="text-xs font-semibold text-slate-100">
              Ask Frame Advice
            </span>
          </div>

          <span className="relative sm:hidden text-xs font-bold text-amber-400 pr-1">
            AI
          </span>
        </button>
      </div>

      {/* Conversational Assistant Modal */}
      <GeminiFrameStylist isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
