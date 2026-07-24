"use client";

import { Glasses, ClipboardList, Layers, Truck } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Glasses,
    title: "Select Frame",
    desc: "Lightweight Japanese titanium or bio-acetate. Browse our curated catalog of premium optical frames.",
  },
  {
    step: "02",
    icon: ClipboardList,
    title: "Enter Prescription",
    desc: "Input your SPH, CYL, Axis & PD values from your optometrist report. Secure and accurate.",
  },
  {
    step: "03",
    icon: Layers,
    title: "Choose Lens Type",
    desc: "Anti-blue light, photochromic transitions, or polarized sun tints. All with UV400 protection.",
  },
  {
    step: "04",
    icon: Truck,
    title: "Doorstep Delivery",
    desc: "Fast 250 PKR shipping nationwide. Pay with EasyPaisa, JazzCash, Bank Transfer, or COD.",
  },
];

export default function PrescriptionSteps() {
  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Prescription In 4 Steps
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            From frame selection to doorstep delivery — our precision engine handles it all.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-sm relative"
            >
              {/* Step number */}
              <span className="text-[10px] font-extrabold text-brand uppercase tracking-widest">
                Step {s.step}
              </span>

              {/* Icon */}
              <div className="mt-4 mb-4 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center group-hover:bg-brand-dark transition-colors">
                <s.icon className="w-4.5 h-4.5" />
              </div>

              {/* Title & Desc */}
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                {s.title}
              </h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                {s.desc}
              </p>

              {/* Connector line for desktop (except last) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-slate-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
