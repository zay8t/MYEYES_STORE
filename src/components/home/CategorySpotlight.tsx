"use client";

import Link from "next/link";
import { Glasses, Sun, ArrowRight, Check } from "lucide-react";

const LENS_PRICING = [
  {
    name: "Standard Single Vision",
    price: "Included",
    badge: "Rs. 0",
    included: true,
  },
  {
    name: "Blue Light Filter Shield",
    price: "+Rs. 850",
    badge: "+Rs. 850",
    included: false,
  },
  {
    name: "Photochromic / Transitions",
    price: "+Rs. 1,450",
    badge: "+Rs. 1,450",
    included: false,
  },
  {
    name: "Polarized Sunglasses Lens",
    price: "+Rs. 1,200",
    badge: "+Rs. 1,200",
    included: false,
  },
];

export default function CategorySpotlight() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-slate-100/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
        {/* ---- Category Banners ---- */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              EXPLORE CATEGORIES
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Shop By Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Eyeglasses Banner */}
            <Link
              href="/eyeglasses"
              className="card-hover group relative rounded-2xl border border-slate-200/80 bg-white p-8 transition-all duration-300 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center mb-4">
                  <Glasses className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  Prescription Eyeglasses
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                  Lightweight, all-day comfortable frames for distance, reading,
                  or progressive vision. Add blue-light or anti-glare protection at checkout.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand group-hover:text-brand-dark group-hover:gap-3.5 transition-all duration-300">
                Shop Eyeglasses
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Sunglasses Banner */}
            <Link
              href="/sunglasses"
              className="card-hover group relative rounded-2xl border border-slate-200/80 bg-slate-900 p-8 transition-all duration-300 hover:bg-black hover:shadow-xl hover:shadow-slate-900/20 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center mb-4">
                  <Sun className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">
                  Polarized Sunglasses
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  100% UV-blocking sunglasses that stop blinding sun glare
                  while driving, working outdoors, or enjoying sunny days.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand group-hover:text-white group-hover:gap-3.5 transition-all duration-300">
                Shop Sunglasses
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>

        {/* ---- Lens Pricing Table ---- */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              SIMPLE PRICING
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Lens Price Guide
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Every frame includes standard clear prescription lenses for free. Upgrade to special coatings below.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-slate-50 px-6 py-3 border-b border-slate-200/80">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest col-span-2">
                  Lens Option
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-right">
                  Price
                </span>
              </div>

              {/* Table Rows */}
              {LENS_PRICING.map((lens, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-6 py-4 items-center transition-colors hover:bg-slate-50/50 ${i < LENS_PRICING.length - 1
                    ? "border-b border-slate-100"
                    : ""
                    }`}
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${lens.included
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {lens.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold ${lens.included ? "text-slate-900" : "text-slate-600"
                        }`}
                    >
                      {lens.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
              All lenses come with free anti-glare coating and 100% UV protection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
