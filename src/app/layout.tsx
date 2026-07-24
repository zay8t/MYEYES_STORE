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
  title: "My Eyes — Minimal Eyewear Studio",
  description:
    "Handcrafted optical frames and precision sunglasses. Minimalist design, optical excellence.",
  keywords: ["eyewear", "glasses", "optical", "sunglasses", "prescription lenses"],
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
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-slate-900 min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-100 bg-white py-12">
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
                Precision Handcrafted Eyewear · Complimentary Prescription Fitting
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
