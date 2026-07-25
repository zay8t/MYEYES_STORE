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
      return (
        <div className="flex h-full w-full items-center justify-center bg-transparent">
          <span className="text-xs text-slate-400">
            3D preview unavailable
          </span>
        </div>
      );
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