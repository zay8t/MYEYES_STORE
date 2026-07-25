"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Minimize2, Rotate3d } from "lucide-react";
import { cn } from "@/lib/utils";

const Hero3DViewerInner = dynamic(() => import("./Hero3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-transparent">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      <span className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Loading 3D Frame...
      </span>
    </div>
  ),
});

export default function Persistent3DViewer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't display floating widget on admin pages to keep dashboard clean
  if (pathname?.startsWith("/admin")) return null;

  // On Home Page: The 3D viewer is rendered inline in the Hero section container.
  // On Other Pages: The 3D viewer floats continuously in the bottom-right corner throughout the session.
  if (isHomePage) {
    return null; // Handled by inline hero anchor on homepage
  }

  return (
    <div
      className={cn(
        "fixed z-40 transition-all duration-500 ease-in-out select-none",
        minimized
          ? "bottom-6 right-6 w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 border border-slate-700"
          : "bottom-6 right-6 w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-3 flex flex-col"
      )}
    >
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="w-full h-full flex items-center justify-center relative group"
          aria-label="Expand 3D Model"
        >
          <Rotate3d className="w-6 h-6 text-brand animate-spin-slow" />
          <span className="absolute -top-8 right-0 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Show 3D Frame
          </span>
        </button>
      ) : (
        <>
          {/* Header Controls */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100/80">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                MY EYES 3D STUDIO
              </span>
            </div>
            <button
              onClick={() => setMinimized(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Minimize 3D Viewer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Canvas Area */}
          <div className="flex-1 w-full relative bg-transparent overflow-hidden rounded-2xl">
            <Hero3DViewerInner />
            <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-100">
                Drag to Inspect 360°
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
