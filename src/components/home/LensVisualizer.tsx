"use client";

import { useState } from "react";
import { ShieldCheck, Droplets, Sparkles, HelpCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Configs                                                           */
/* ------------------------------------------------------------------ */

const LENS_TINTS = [
  {
    id: "clear",
    label: "Clear Prescription",
    color: "rgba(226,232,240,0.25)",
    border: "#cbd5e1",
    desc: "Optical-grade clarity with anti-reflective coating for everyday wear.",
  },
  {
    id: "bluelight",
    label: "Blue Light Shield",
    color: "rgba(147,197,253,0.35)",
    border: "#93c5fd",
    desc: "Blocks harmful HEV blue-light from screens. Perfect for digital work.",
  },
  {
    id: "polarized",
    label: "Polarized Sun (Gray)",
    color: "rgba(51,65,85,0.55)",
    border: "#334155",
    desc: "Polarized gray tint eliminates glare & provides true-color perception.",
  },
  {
    id: "amber",
    label: "Amber Drive Tint",
    color: "rgba(217,119,6,0.35)",
    border: "#d97706",
    desc: "Enhances contrast in low-light driving conditions. Road-safe certified.",
  },
];

const FRAME_SHAPES = [
  {
    id: "round",
    label: "Round Classic",
    desc: "Timeless retro silhouette, perfect for square or angular face shapes.",
  },
  {
    id: "square",
    label: "Square Modern",
    desc: "Architectural lines that add definition to round or oval face shapes.",
  },
  {
    id: "aviator",
    label: "Aviator Heritage",
    desc: "Iconic teardrop shape that offers maximum coverage and classic aesthetic.",
  },
];

const FEATURES = [
  { icon: ShieldCheck, label: "100% UV400 Protection" },
  { icon: Sparkles, label: "Anti-Scratch Coating" },
  { icon: Droplets, label: "Hydrophobic Easy-Clean" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LensVisualizer() {
  const [activeTint, setActiveTint] = useState(0);
  const [activeShape, setActiveShape] = useState(0);

  const tint = LENS_TINTS[activeTint];
  const shape = FRAME_SHAPES[activeShape];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            MYEYES CUSTOMIZER
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            MyEyes Lens &amp; Frame Previewer
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Configure your premium optical frames with custom shapes and high-performance lens coatings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Live Preview Frame */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl border border-slate-200/80 bg-slate-50/30 flex items-center justify-center overflow-hidden">
              {/* Glasses SVG with dynamic lens fill and shape */}
              <svg
                viewBox="0 0 400 180"
                className="w-[85%] h-auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Bridge */}
                <path
                  d="M188 80 Q200 65 212 80"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Left Temple */}
                <line
                  x1="52"
                  y1="70"
                  x2="6"
                  y2="55"
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Right Temple */}
                <line
                  x1="348"
                  y1="70"
                  x2="394"
                  y2="55"
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Left Rim & Lens (Dynamic based on selected shape) */}
                {shape.id === "round" && (
                  <>
                    <ellipse
                      cx="120"
                      cy="90"
                      rx="68"
                      ry="60"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <ellipse
                      cx="120"
                      cy="90"
                      rx="63"
                      ry="55"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <ellipse
                      cx="100"
                      cy="75"
                      rx="22"
                      ry="12"
                      fill="rgba(255,255,255,0.18)"
                      transform="rotate(-15 100 75)"
                    />
                  </>
                )}

                {shape.id === "square" && (
                  <>
                    <rect
                      x="52"
                      y="30"
                      width="136"
                      height="120"
                      rx="20"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <rect
                      x="57"
                      y="35"
                      width="126"
                      height="110"
                      rx="15"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <path
                      d="M 67 45 L 110 45 L 85 95 Z"
                      fill="rgba(255,255,255,0.12)"
                    />
                  </>
                )}

                {shape.id === "aviator" && (
                  <>
                    <path
                      d="M52,60 C52,40 188,40 188,60 C188,100 160,150 120,150 C80,150 52,100 52,60 Z"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <path
                      d="M57,61 C57,45 183,45 183,61 C183,97 156,144 120,144 C84,144 57,97 57,61 Z"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <path
                      d="M 67 61 C 67 52 110 52 110 61 C 110 75 90 100 80 100 Z"
                      fill="rgba(255,255,255,0.12)"
                    />
                  </>
                )}

                {/* Right Rim & Lens (Dynamic based on selected shape) */}
                {shape.id === "round" && (
                  <>
                    <ellipse
                      cx="280"
                      cy="90"
                      rx="68"
                      ry="60"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <ellipse
                      cx="280"
                      cy="90"
                      rx="63"
                      ry="55"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <ellipse
                      cx="260"
                      cy="75"
                      rx="22"
                      ry="12"
                      fill="rgba(255,255,255,0.18)"
                      transform="rotate(-15 260 75)"
                    />
                  </>
                )}

                {shape.id === "square" && (
                  <>
                    <rect
                      x="212"
                      y="30"
                      width="136"
                      height="120"
                      rx="20"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <rect
                      x="217"
                      y="35"
                      width="126"
                      height="110"
                      rx="15"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <path
                      d="M 227 45 L 270 45 L 245 95 Z"
                      fill="rgba(255,255,255,0.12)"
                    />
                  </>
                )}

                {shape.id === "aviator" && (
                  <>
                    <path
                      d="M212,60 C212,40 348,40 348,60 C348,100 320,150 280,150 C240,150 212,100 212,60 Z"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="5"
                    />
                    <path
                      d="M217,61 C217,45 343,45 343,61 C343,97 316,144 280,144 C244,144 217,97 217,61 Z"
                      fill={tint.color}
                      className="transition-all duration-500"
                    />
                    {/* Subtle reflection highlights */}
                    <path
                      d="M 227 61 C 227 52 270 52 270 61 C 270 75 250 100 240 100 Z"
                      fill="rgba(255,255,255,0.12)"
                    />
                  </>
                )}

                {/* Nose pads */}
                <circle cx="178" cy="105" r="5" fill="#cbd5e1" />
                <circle cx="222" cy="105" r="5" fill="#cbd5e1" />
              </svg>

              {/* Active label badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-white"
                  style={{
                    borderColor: tint.border,
                    color: tint.border,
                  }}
                >
                  {shape.label} / {tint.label}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Frame Shapes Selection */}
            <div className="space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Select Frame Shape
              </span>
              <div className="grid grid-cols-3 gap-3">
                {FRAME_SHAPES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveShape(i)}
                    className={`px-3 py-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                      activeShape === i
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold block">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lens Swatches */}
            <div className="space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Select Lens Type &amp; Tint
              </span>
              <div className="grid grid-cols-2 gap-3">
                {LENS_TINTS.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTint(i)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                      activeTint === i
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                      style={{
                        backgroundColor: t.color,
                        borderColor: activeTint === i ? "white" : t.border,
                      }}
                    />
                    <span className="text-[11px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Details
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>{shape.label}:</strong> {shape.desc}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>{tint.label}:</strong> {tint.desc}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap gap-3">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60"
                >
                  <f.icon className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
