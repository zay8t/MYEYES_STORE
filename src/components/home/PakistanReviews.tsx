"use client";

import { Star, BadgeCheck, MapPin } from "lucide-react";

const REVIEWS = [
  {
    name: "Zayd Ali",
    city: "Islamabad",
    initials: "ZA",
    review:
      "Ordered my custom prescription eyeglasses with blue-light coating. Delivered to Gulberg in 3 days. Lens clarity is 10/10!",
    stars: 5,
  },
  {
    name: "Ayesha Khan",
    city: "Karachi",
    initials: "AK",
    review:
      "Was skeptical about ordering prescription glasses online, but entering my SPH and CYL specs was super easy. Payment via EasyPaisa was instant.",
    stars: 5,
  },
  {
    name: "Hamza Malik",
    city: "Islamabad",
    initials: "HM",
    review:
      "Flat 250 PKR delivery fee nationwide. The titanium frame is incredibly lightweight and looks even better than the 3D model.",
    stars: 5,
  },
  {
    name: "Usman Tariq",
    city: "Peshawar",
    initials: "UT",
    review:
      "Great optical prescription fitting! The PD alignment was exact and the anti-reflective lens coating is top-tier.",
    stars: 5,
  },
];

export default function PakistanReviews() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            TRUSTED NATIONWIDE
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Verified Customer Reviews
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Real feedback from prescription eyewear customers across Pakistan.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="card-hover group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:border-slate-300 flex flex-col justify-between"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.stars }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 fill-slate-900 text-slate-900"
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-[13px] text-slate-600 leading-relaxed flex-1">
                &ldquo;{r.review}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-extrabold tracking-wide">
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {r.name}
                    </span>
                    <BadgeCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <MapPin className="w-2.5 h-2.5" />
                    {r.city}, Pakistan
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge Strip */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Delivering All Across Pakistan 🇵🇰
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
