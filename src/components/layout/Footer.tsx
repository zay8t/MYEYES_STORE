import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="My Eyes Logo" width={24} height={24} className="object-contain" />
              <span className="text-base font-extrabold tracking-tight text-brand uppercase">
                MY EYES
              </span>
            </div>
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} Optical Studio
            </span>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Pakistan Prescription Based Eyewear Store · Delivering All Across world
            </p>
            {/* Discreet staff access link — intentionally low-contrast */}
            <Link
              href="/admin"
              id="footer-staff-login"
              className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors duration-200 whitespace-nowrap select-none"
              aria-label="Staff Portal"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

