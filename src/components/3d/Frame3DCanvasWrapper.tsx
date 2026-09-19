'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, ShieldCheck, Sun, Camera, Video, CheckCircle2, Loader2 } from 'lucide-react';
import type { FrameShape, FrameFinish, LensTint, ViewerExportAPI } from './Hero3DViewerInner';

const Hero3DViewerInner = dynamic(() => import('./Hero3DViewerInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '0.15s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
      <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
        Initializing 3D Eyewear Studio...
      </span>
    </div>
  ),
});

export default function Frame3DCanvasWrapper() {
  const [shape, setShape] = useState<FrameShape>('round');
  const [finish, setFinish] = useState<FrameFinish>('onyx');
  const [lens, setLens] = useState<LensTint>('blue');

  const [isMobile, setIsMobile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const exportApiRef = useRef<ViewerExportAPI | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const targetRotationY = useRef<number>(0);
  const isDragging = useRef(false);
  const autoRotating = useRef(true);

  const lastX = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const velocity = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const now = performance.now();
    const dt = Math.max(now - lastTime.current, 1);
    const dx = e.clientX - lastX.current;

    const instantaneousVelocity = (dx / dt) * 0.02;
    velocity.current = velocity.current * 0.6 + instantaneousVelocity * 0.4;
    targetRotationY.current += dx * 0.015;

    lastX.current = e.clientX;
    lastTime.current = now;
    autoRotating.current = false;
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const rawImpulse = velocity.current * 18.0;
    const clampedImpulse = Math.min(Math.max(rawImpulse, -Math.PI * 1.5), Math.PI * 1.5);
    targetRotationY.current += clampedImpulse;
    velocity.current = 0;
  }, []);

  const handleTakeSnapshot = async () => {
    if (!exportApiRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await exportApiRef.current.takeSnapshot();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `myeyes-${shape}-${finish}-${lens}.png`;
        link.href = dataUrl;
        link.click();
        setExportNotice('Studio Snapshot Saved!');
        setTimeout(() => setExportNotice(null), 3000);
      }
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRecordShowcase = async () => {
    if (!exportApiRef.current || isRecording) return;
    setIsRecording(true);
    setExportNotice('Recording 360 Showcase (4s)...');
    try {
      const blob = await exportApiRef.current.startRecording(4000);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `myeyes-showcase-${shape}.webm`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setExportNotice('360 Video Exported!');
        setTimeout(() => setExportNotice(null), 3000);
      }
    } catch (err) {
      console.error('Recording failed:', err);
    } finally {
      setIsRecording(false);
    }
  };

  const SHAPE_OPTIONS: { id: FrameShape; label: string; icon: string }[] = [
    { id: 'round', label: 'Classic Round', icon: '◯' },
    { id: 'aviator', label: 'Titanium Aviator', icon: '◬' },
    { id: 'square', label: 'Square Browline', icon: '▢' },
    { id: 'cateye', label: 'Cat-Eye Luxe', icon: '◇' },
  ];

  const FINISH_OPTIONS: { id: FrameFinish; label: string; colorClass: string }[] = [
    { id: 'onyx', label: 'Onyx Black', colorClass: 'bg-slate-900 border-slate-700 ring-slate-900' },
    { id: 'gold', label: '24K Gold', colorClass: 'bg-amber-400 border-amber-300 ring-amber-400' },
    { id: 'silver', label: 'Metallic Silver', colorClass: 'bg-slate-200 border-slate-300 ring-slate-400' },
    { id: 'rosegold', label: 'Rose Gold', colorClass: 'bg-rose-400 border-rose-300 ring-rose-400' },
  ];

  const LENS_OPTIONS: {
    id: LensTint;
    label: string;
    shortLabel: string;
    bgClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'blue', label: 'Anti-Blue Light', shortLabel: 'Anti-Blue', bgClass: 'bg-sky-400', icon: ShieldCheck },
    { id: 'amber', label: 'Sun Amber', shortLabel: 'Sun', bgClass: 'bg-amber-500', icon: Sun },
    { id: 'emerald', label: 'Emerald Tint', shortLabel: 'Emerald', bgClass: 'bg-emerald-500', icon: Sparkles },
    { id: 'clear', label: 'Ultra Clear', shortLabel: 'Ultra', bgClass: 'bg-slate-100 border border-slate-300', icon: Eye },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-transparent p-1 sm:p-3 overflow-visible group">
      {/* ─── 3D Canvas + Mobile Gesture Overlay ─────────────────────────────── */}
      <div className="w-full flex-1 relative flex items-center justify-center my-1 min-h-[300px] sm:min-h-[340px]">
        <Hero3DViewerInner
          frameShape={shape}
          frameFinish={finish}
          lensTint={lens}
          autoRotate={autoRotating.current}
          targetRotationY={targetRotationY}
          isMobile={isMobile}
          onExportReady={(api) => {
            exportApiRef.current = api;
          }}
        />

        {/* Mobile Horizontal Rotation Overlay */}
        {isMobile && (
          <div
            className="absolute inset-0 z-10"
            style={{ touchAction: 'pan-y', pointerEvents: 'auto', cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Drag left or right to rotate eyewear frame"
          />
        )}

        {/* Floating Quick Action Badge */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
          <button
            type="button"
            onClick={handleTakeSnapshot}
            disabled={isExporting}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Export HD Studio Snapshot"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <div className="w-[1px] h-3 bg-slate-200" />
          <button
            type="button"
            onClick={handleRecordShowcase}
            disabled={isRecording}
            className={`p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
              isRecording ? 'text-rose-600 bg-rose-50 animate-pulse' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Record 360 Video Showcase"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Toast Overlay */}
        <AnimatePresence>
          {exportNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-12 right-2 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── UI Customization Dock ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full z-30 pointer-events-auto flex flex-col gap-3 pt-3 bg-white/70 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100/50"
      >
        {/* Row 1: Frame Model Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Frame Model:</span>
          <div className="relative flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {SHAPE_OPTIONS.map((opt) => {
              const active = shape === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setShape(opt.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors duration-200 flex items-center gap-1.5 z-10 cursor-pointer ${
                    active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeShapeTab"
                      className="absolute inset-0 bg-slate-900 rounded-lg shadow-sm z-[-1]"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="text-xs">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Material Swatches + Lens Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100/60">
          {/* Acetate Material Swatches */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0">Material:</span>
            <div className="flex items-center gap-2">
              {FINISH_OPTIONS.map((f) => {
                const active = finish === f.id;
                return (
                  <motion.button
                    type="button"
                    key={f.id}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFinish(f.id)}
                    className={`relative p-0.5 rounded-full transition-all duration-200 cursor-pointer ${
                      active ? 'ring-2 ring-offset-2 ' + f.colorClass : ''
                    }`}
                    title={f.label}
                  >
                    <span className={`block w-5 h-5 rounded-full border border-black/10 shadow-sm ${f.colorClass}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Lens Filter Swatches */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 sm:gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0">
              Lens Filter:
            </span>
            <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto">
              {LENS_OPTIONS.map((l) => {
                const active = lens === l.id;
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setLens(l.id)}
                    className={`relative px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-1 z-10 w-full cursor-pointer ${
                      active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={l.label}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeLensTab"
                        className="absolute inset-0 bg-slate-900 rounded-lg shadow-sm z-[-1]"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${l.bgClass}`} />
                    <span className="truncate">{l.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
