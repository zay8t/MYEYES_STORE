'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Sparkles, Eye, ShieldCheck, Sun } from 'lucide-react';
import type { FrameShape, FrameFinish, LensTint } from './Hero3DViewerInner';

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
  const [autoRotate] = useState(true);

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

  const LENS_OPTIONS: { id: LensTint; label: string; bgClass: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'blue', label: 'Anti-Blue Light', bgClass: 'bg-sky-400', icon: ShieldCheck },
    { id: 'amber', label: 'Sun Amber', bgClass: 'bg-amber-500', icon: Sun },
    { id: 'emerald', label: 'Emerald Tint', bgClass: 'bg-emerald-500', icon: Sparkles },
    { id: 'clear', label: 'Ultra Clear', bgClass: 'bg-slate-100 border border-slate-300', icon: Eye },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-transparent border-0 shadow-none p-1 sm:p-3 overflow-visible group">
      
      {/* 3D Canvas Container */}
      <div className="w-full flex-1 relative flex items-center justify-center my-1 min-h-[280px]">
        <Hero3DViewerInner
          frameShape={shape}
          frameFinish={finish}
          lensTint={lens}
          autoRotate={autoRotate}
        />
      </div>

      {/* Interactive Floating Micro-Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full z-20 flex flex-col gap-3 pt-3 bg-white/70 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100/50"
      >
        {/* Row 1: Frame Shape Selector Tabs with Motion Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Frame Model:
          </span>
          <div className="relative flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {SHAPE_OPTIONS.map((opt) => {
              const active = shape === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setShape(opt.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors duration-200 flex items-center gap-1.5 z-10 ${
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

        {/* Row 2: Material Finish Swatches & Lens Tint Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-100/60">
          
          {/* Finish Swatches */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Material:
            </span>
            <div className="flex items-center gap-2">
              {FINISH_OPTIONS.map((f) => {
                const active = finish === f.id;
                return (
                  <motion.button
                    key={f.id}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFinish(f.id)}
                    className={`relative p-0.5 rounded-full transition-all duration-200 ${
                      active ? 'ring-2 ring-offset-2 ' + f.colorClass : ''
                    }`}
                    title={f.label}
                  >
                    <span className={`block w-4.5 h-4.5 rounded-full border border-black/10 shadow-sm ${f.colorClass}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Lens Tint Swatches with Spring Tab */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Lens Filter:
            </span>
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              {LENS_OPTIONS.map((l) => {
                const active = lens === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLens(l.id)}
                    className={`relative px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 z-10 ${
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
                    <span className={`w-2 h-2 rounded-full ${l.bgClass}`} />
                    <span>{l.label.split(' ')[0]}</span>
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
