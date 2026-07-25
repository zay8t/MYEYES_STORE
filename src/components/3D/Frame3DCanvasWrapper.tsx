"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------- */
/*  Lazy-loaded 3D viewer                                                */
/*  ssr: false because @react-three/fiber touches WebGL/window on init  */
/* -------------------------------------------------------------------- */

const Hero3DViewerInner = dynamic(() => import("./Hero3DViewer"), {
  ssr: false,
  loading: () => <ViewerFallback />,
});

/* -------------------------------------------------------------------- */
/*  Fallback UI — shown while the chunk downloads AND reused as the     */
/*  pre-mount placeholder below, so there's no visual swap between them */
/* -------------------------------------------------------------------- */

function ViewerFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-transparent">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      <span className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Loading 3D Frame...
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Error boundary — a WebGL context loss or bundle failure shouldn't   */
/*  blank the whole hero section. Fails down to a static state instead. */
/* -------------------------------------------------------------------- */

function HighResFallbackImage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50/20 rounded-3xl p-6 relative overflow-hidden border border-slate-100/50 animate-fade-in">
      <div className="relative z-10 w-[300px] max-w-full aspect-[2/1] flex items-center justify-center select-none pointer-events-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.06)] transform hover:scale-[1.03] transition-transform duration-300">
        <svg
          viewBox="0 0 400 180"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bridge */}
          <path
            d="M188 80 Q200 65 212 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Left Temple */}
          <line
            x1="52"
            y1="70"
            x2="6"
            y2="55"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Right Temple */}
          <line
            x1="348"
            y1="70"
            x2="394"
            y2="55"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Left Rim */}
          <ellipse
            cx="120"
            cy="90"
            rx="68"
            ry="60"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
          />
          {/* Left Lens with reflection */}
          <ellipse
            cx="120"
            cy="90"
            rx="64"
            ry="56"
            fill="rgba(255,122,0,0.06)"
          />
          <ellipse
            cx="100"
            cy="75"
            rx="22"
            ry="12"
            fill="rgba(255,255,255,0.22)"
            transform="rotate(-15 100 75)"
          />
          {/* Right Rim */}
          <ellipse
            cx="280"
            cy="90"
            rx="68"
            ry="60"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
          />
          {/* Right Lens with reflection */}
          <ellipse
            cx="280"
            cy="90"
            rx="64"
            ry="56"
            fill="rgba(255,122,0,0.06)"
          />
          <ellipse
            cx="260"
            cy="75"
            rx="22"
            ry="12"
            fill="rgba(255,255,255,0.22)"
            transform="rotate(-15 260 75)"
          />
          {/* Nose pads */}
          <circle cx="178" cy="105" r="5.5" fill="#cbd5e1" />
          <circle cx="222" cy="105" r="5.5" fill="#cbd5e1" />
        </svg>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 relative z-10">
        Premium Japanese Acetate Frame Preview
      </span>
    </div>
  );
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Swap for your logger of choice (Sentry, etc.)
    console.error("Hero3DViewer failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return <HighResFallbackImage />;
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------- */
/*  Public component                                                    */
/*  Only mounts the (heavy) 3D chunk once the container scrolls into    */
/*  view, instead of paying for it on every page load regardless of     */
/*  whether the hero is ever seen.                                      */
/* -------------------------------------------------------------------- */

export function Hero3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Already visible on mount (e.g. hero is above the fold) — skip
    // the observer round-trip entirely.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading slightly before it's on screen
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      {isInView ? (
        <ViewerErrorBoundary>
          <Hero3DViewerInner />
        </ViewerErrorBoundary>
      ) : (
        <ViewerFallback />
      )}
    </div>
  );
}

export default Hero3DViewer;