import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";

import Image from "next/image";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "My Eyes — Pakistan Prescription Based Eyewear Store",
  description:
    "Order premium prescription eyeglasses & sunglasses online. Pakistan prescription based eyewear store with lab-precision fitting, delivering all across Pakistan.",
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
        <Footer />
      </body>
    </html>
  );
}
