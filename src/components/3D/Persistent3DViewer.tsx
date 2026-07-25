"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type CSSProperties } from "react";
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

/**
 * Drop this placeholder into the homepage Hero section, exactly where
 * the 3D viewer should visually sit. It reserves the layout space and
 * spot — the actual canvas is pinned on top of it via fixed positioning,
 * it is NOT rendered inside the hero tree itself.
 *
 *   <div id={HERO_ANCHOR_ID} className="w-full aspect-square max-w-xl" />
 */
export const HERO_ANCHOR_ID = "hero-3d-anchor";

const FLOATING_MARGIN = 24;
const FLOATING_SIZE_OPEN = 288;
const FLOATING_SIZE_MIN = 56;

type Rect = { top: number; left: number; width: number; height: number };

function rectsEqual(a: Rect | null, b: Rect) {
  if (!a) return false;
  return (
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}

/**
 * Mount this ONCE, as a sibling of {children} in the root layout
 * (app/layout.tsx) — never inside a page or a route segment that can
 * unmount on navigation. The <Hero3DViewerInner /> Canvas below is
 * rendered exactly once for the entire session; everything else here
 * is CSS repositioning a fixed-position box on top of it, which is
 * what makes it survive page changes without flicker or WebGL re-init.
 */
export default function Persistent3DViewer() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isInline, setIsInline] = useState(false);

  const minimizedRef = useRef(minimized);
  const isAdmin = Boolean(pathname?.startsWith("/admin"));
  const isAdminRef = useRef(isAdmin);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  useEffect(() => {
    setMounted(true);
    let animationFrameId: number;

    const measure = () => {
      const anchor = !isAdminRef.current
        ? document.getElementById(HERO_ANCHOR_ID)
        : null;
      const anchorBox = anchor?.getBoundingClientRect();
      const anchorVisible =
        !!anchorBox &&
        anchorBox.width > 0 &&
        anchorBox.height > 0 &&
        anchorBox.bottom > 0 &&
        anchorBox.top < window.innerHeight;

      let target: Rect;
      let inline: boolean;

      if (isAdminRef.current) {
        // Keep the canvas alive but fully off-screen — zero WebGL
        // re-init cost if the user navigates back from the dashboard.
        target = { top: -9999, left: -9999, width: 256, height: 256 };
        inline = false;
      } else if (anchorVisible && anchorBox) {
        target = {
          top: anchorBox.top,
          left: anchorBox.left,
          width: anchorBox.width,
          height: anchorBox.height,
        };
        inline = true;
      } else {
        const size = minimizedRef.current ? FLOATING_SIZE_MIN : FLOATING_SIZE_OPEN;
        target = {
          top: window.innerHeight - FLOATING_MARGIN - size,
          left: window.innerWidth - FLOATING_MARGIN - size,
          width: size,
          height: size,
        };
        inline = false;
      }

      setRect((prev) => (rectsEqual(prev, target) ? prev : target));
      setIsInline((prev) => (prev === inline ? prev : inline));

      animationFrameId = requestAnimationFrame(measure);
    };

    animationFrameId = requestAnimationFrame(measure);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!mounted || !rect) return null;

  const style: CSSProperties = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };

  return (
    <div
      className={cn(
        "fixed z-40 select-none transition-all duration-500 ease-in-out",
        isInline || isAdmin
          ? "bg-transparent"
          : minimized
            ? "rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 border border-slate-700"
            : "rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-3 flex flex-col"
      )}
      style={style}
      aria-hidden={isAdmin || undefined}
    >
      {isInline || isAdmin ? (
        <Hero3DViewerInner />
      ) : minimized ? (
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