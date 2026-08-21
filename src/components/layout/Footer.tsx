import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-800 py-16 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Sleek 3-Column Minimal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16">
          {/* Column 1: About MyEyes (~40% width on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="My Eyes Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider text-[#ff7a00] uppercase group-hover:text-amber-600 transition-colors">
                  MY EYES
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
                  OPTICAL STUDIO
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 font-normal leading-relaxed max-w-md">
              Crafting lab-precision prescription eyewear and premium frames tailored to your exact optical parameters. Delivered nationwide across Pakistan and world.
            </p>

            <p className="text-[11px] text-slate-400 font-medium pt-1">
              Prescription verified by optical specialists.
            </p>
          </div>

          {/* Column 2: Quick Links / Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Explore
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 font-normal">
              <li>
                <Link
                  href="/eyeglasses"
                  className="hover:text-[#ff7a00] transition-colors"
                >
                  Prescription Eyeglasses
                </Link>
              </li>
              <li>
                <Link
                  href="/sunglasses"
                  className="hover:text-[#ff7a00] transition-colors"
                >
                  Sunglasses Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#ff7a00] transition-colors"
                >
                  Blue Cut &amp; Progressive Lenses
                </Link>
              </li>
              <li>
                <Link
                  href="/quiz"
                  className="hover:text-[#ff7a00] transition-colors"
                >
                  Style &amp; Fit Quiz
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Studio Info */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Get in Touch
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600 font-normal leading-relaxed">
              <div>
                <span className="text-slate-400 block text-[11px]">WhatsApp / Support Line</span>
                <a
                  href="https://wa.me/923006694928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff7a00] transition-colors font-medium text-slate-800"
                >
                  +92 300 6694928
                </a>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <a
                  href="mailto:myeyes2026@gmail.com"
                  className="hover:text-[#ff7a00] transition-colors font-medium text-slate-800"
                >
                  myeyes2026@gmail.com
                </a>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Hours</span>
                <span>Mon – Sat, 10:00 AM – 8:00 PM PKT</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span>Optical Studio &amp; Lab, Pakistan</span>
              </div>

              <div className="pt-2">
                <a
                  href="/myeyes.apk"
                  download="MyEyes.apk"
                  className="inline-block text-xs font-medium text-slate-700 hover:text-[#ff7a00] underline underline-offset-4 transition-colors"
                >
                  Download Android App (.apk)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="border-t border-slate-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 MyEyes Optical Studio. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="hover:text-[#ff7a00] transition-colors"
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <Link
              href="/terms"
              className="hover:text-[#ff7a00] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
