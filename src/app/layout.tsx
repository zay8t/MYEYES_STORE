import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

import Image from "next/image";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "My Eyes — Pakistan's First Prescription Eyewear Store",
  description:
    "Order premium prescription eyeglasses & sunglasses online. Pakistan's first prescription-based eyewear store with lab-precision fitting, delivering all across Pakistan.",
  keywords: ["eyewear", "glasses", "optical", "sunglasses", "prescription lenses", "Pakistan", "online eyewear store", "My Eyes"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-slate-900 min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>


        {/* Minimal Footer */}
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
              <p className="text-xs text-slate-500 font-medium">
                Pakistan&apos;s First Prescription Eyewear Store · Delivering All Across Pakistan 🇵🇰
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
