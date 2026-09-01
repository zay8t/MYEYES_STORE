"use client";

import Link from "next/link";
import { Glasses, Sun, ArrowRight } from "lucide-react";

export default function CategorySpotlight() {
  return (
    <section className="pt-12 sm:pt-16 pb-6 sm:pb-8 bg-white border-t border-slate-100/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
        {/* ---- Category Banners ---- */}
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
    </section>
  );
}
