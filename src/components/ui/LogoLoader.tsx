'use client';

import React from 'react';

interface LogoLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
}

export default function LogoLoader({
  text = 'LOADING OPTICAL STUDIO...',
  size = 'fullscreen',
}: LogoLoaderProps) {
  const isFullscreen = size === 'fullscreen';

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white ${
        isFullscreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'w-full py-16'
      }`}
    >
      <div className="relative flex flex-col items-center space-y-5">
        
        {/* Animated Eyewear Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute w-24 h-24 rounded-full bg-amber-500/10 animate-ping opacity-60 pointer-events-none" />

          {/* Eyewear SVG Icon */}
          <svg
            className="w-16 h-16 sm:w-20 sm:h-20 animate-pulse text-[#0F172A]"
            viewBox="0 0 100 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Lens Frame */}
            <circle
              cx="26"
              cy="25"
              r="18"
              stroke="#0F172A"
              strokeWidth="4"
              className="transition-all"
            />
            {/* Left Lens Inner Pupil/Glint */}
            <circle cx="23" cy="22" r="4" fill="#F59E0B" className="animate-bounce" style={{ animationDuration: '1.4s' }} />

            {/* Nose Bridge */}
            <path
              d="M 44 23 Q 50 18 56 23"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Right Lens Frame */}
            <circle
              cx="74"
              cy="25"
              r="18"
              stroke="#0F172A"
              strokeWidth="4"
              className="transition-all"
            />
            {/* Right Lens Inner Pupil/Glint */}
            <circle cx="71" cy="22" r="4" fill="#F59E0B" className="animate-bounce" style={{ animationDuration: '1.4s', animationDelay: '0.2s' }} />

            {/* Temple Left */}
            <path d="M 8 22 L 2 24" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
            {/* Temple Right */}
            <path d="M 92 22 L 98 24" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Brand Name & Animated Shimmer Subtitle */}
        <div className="flex flex-col items-center space-y-1.5">
          <span className="text-sm font-black tracking-[0.25em] text-[#0F172A] uppercase">
            MY EYES
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase animate-pulse">
            {text}
          </span>
        </div>

        {/* Minimal Progress Bar Indicator */}
        <div className="w-28 h-0.5 bg-neutral-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-amber-400 to-slate-900 animate-[indeterminate_1.5s_infinite_linear] origin-left" />
        </div>

      </div>
    </div>
  );
}
