import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import RealtimeSyncProvider from "@/components/RealtimeSyncProvider";
import StandaloneBodyManager from "@/components/StandaloneBodyManager";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ---------------------------------------------------------------------------
// PWA Viewport — enables safe-area insets for iPhone notch / Dynamic Island
// ---------------------------------------------------------------------------
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "My Eyes — Pakistan Prescription Based Eyewear Store",
  description:
    "Order premium prescription eyeglasses & sunglasses online. Pakistan prescription based eyewear store with lab-precision fitting, delivering all across Pakistan.",
  keywords: ["eyewear", "glasses", "optical", "sunglasses", "prescription lenses", "Pakistan", "online eyewear store", "My Eyes"],
  // ---------------------------------------------------------------------------
  // PWA Manifest & Icons
  // ---------------------------------------------------------------------------
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/apple-touch-icon.png",
  },
  // ---------------------------------------------------------------------------
  // iOS PWA meta — enables Add to Home Screen with correct name and icon
  // ---------------------------------------------------------------------------
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyEyes",
  },
  // ---------------------------------------------------------------------------
  // Open Graph — useful for PWA sharing
  // ---------------------------------------------------------------------------
  openGraph: {
    title: "My Eyes — Pakistan Prescription Based Eyewear Store",
    description:
      "Order premium prescription eyeglasses & sunglasses online in Pakistan.",
    type: "website",
    locale: "en_US",
    siteName: "MyEyes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-slate-900 min-h-screen flex flex-col`}
      >
        <RealtimeSyncProvider>
          {/* Manages .has-bottom-nav and .standalone-mode on body strictly in standalone mode */}
          <StandaloneBodyManager />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <PWAInstallBanner />
          {/* MobileBottomNav strictly renders in standalone mode */}
          <MobileBottomNav />
        </RealtimeSyncProvider>
      </body>
    </html>
  );
}
