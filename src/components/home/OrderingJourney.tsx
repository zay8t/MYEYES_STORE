"use client";

import React from "react";
import { Glasses, FileCheck2, Layers, Truck } from "lucide-react";

interface MilestoneStep {
  step: string;
  title: string;
  description: string;
  microTag: string;
  icon: React.ElementType;
}

const MILESTONES: MilestoneStep[] = [
  {
    step: "01",
    title: "Select Frame Silhouette",
    description:
      "Explore handcrafted acetate, titanium, and lightweight metal frames tailored to your style.",
    microTag: "3D Virtual Fit & Quiz Available",
    icon: Glasses,
  },
  {
    step: "02",
    title: "Upload Rx or Enter SPH / CYL",
    description:
      "Snap a photo of your doctor's slip or manually input your sphere, cylinder, axis, and PD.",
    microTag: "Auto-Reading Verification",
    icon: FileCheck2,
  },
  {
    step: "03",
    title: "Lab-Grade Custom Edging",
    description:
      "Certified optical technicians edge single vision, blue-cut, or progressive lenses to sub-millimeter tolerances.",
    microTag: "Anti-Scratch & UV400 Standard",
    icon: Layers,
  },
  {
    step: "04",
    title: "Safe Nationwide Delivery",
    description:
      "Dispatched in protective cases with easy tracking and our 100% prescription accuracy guarantee.",
    microTag: "Delivered Across Pakistan",
    icon: Truck,
  },
];

export default function OrderingJourney() {
  return (
    <section className="w-full bg-white py-16 md:py-24 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#ff7a00] mb-2 block">
            TRANSPARENT PROCESS
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            From Doctor&apos;s Slip to Doorstep in 4 Precise Steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Hospital-grade lens cutting and certified optometric verification delivered nationwide.
          </p>
        </div>

        {/* 4-Card Milestone Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MILESTONES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden transition-all duration-200 hover:border-slate-200 hover:shadow-sm flex flex-col justify-between space-y-6 group"
              >
                {/* Header row: Step Index & Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-[#ff7a00] font-mono text-sm font-bold tracking-wider">
                    {item.step}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:text-[#ff7a00] group-hover:border-orange-100 group-hover:bg-orange-50/50 transition-colors">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Micro-tag */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md">
                    {item.microTag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
