import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import Footer from "@/components/layout/Footer";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import RealtimeSyncProvider from "@/components/RealtimeSyncProvider";
import StandaloneBodyManager from "@/components/StandaloneBodyManager";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/components/AuthProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ---------------------------------------------------------------------------
// PWA Viewport — pure white #ffffff theme color to prevent orange browser tint
// ---------------------------------------------------------------------------
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://myeyes.pk"),
  title: {
    default: "MY EYES — Optical Studio & Prescription Eyewear",
    template: "%s | MY EYES Optical Studio",
  },
  description:
    "Lab-precision prescription glasses and frames delivered across Pakistan. Features live 3D try-on, 60-second style quiz, and transparent lens pricing.",
  keywords: [
    "eyewear Pakistan",
    "prescription glasses online Pakistan",
    "blue cut computer lenses",
    "progressive lenses Pakistan",
    "online optical store",
    "frame style quiz",
    "custom prescription sunglasses",
  ],
  alternates: {
    canonical: "https://myeyes.pk",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon-48x48.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MY EYES",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "theme-color": "#ffffff",
    "msapplication-TileColor": "#ffffff",
    "msapplication-navbutton-color": "#ffffff",
  },
  openGraph: {
    title: "MY EYES — Optical Studio & Prescription Eyewear",
    description: "Lab-precision prescription glasses & frames delivered across Pakistan.",
    url: "https://myeyes.pk",
    siteName: "MY EYES",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon-192x192.png",
        width: 192,
        height: 192,
        alt: "MY EYES Optical Studio Logo",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OpticalStore",
      "@id": "https://myeyes.pk/#store",
      name: "MY EYES Optical Studio",
      url: "https://myeyes.pk",
      logo: "https://myeyes.pk/icon-192x192.png",
      image: "https://myeyes.pk/icon-192x192.png",
      description:
        "Custom prescription lenses, frames, and sunglasses fitted to precision optical parameters.",
      areaServed: "PK",
      priceRange: "PKR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://myeyes.pk/eyeglasses?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SiteNavigationElement",
      name: [
        "Prescription Eyeglasses",
        "Polarized Sunglasses",
        "Lens Pricing Guide",
        "60-Second Frame Style Quiz",
      ],
      url: [
        "https://myeyes.pk/eyeglasses",
        "https://myeyes.pk/sunglasses",
        "https://myeyes.pk/lens-pricing",
        "https://myeyes.pk/quiz",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TDPFGB5P'} />
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-navbutton-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MY EYES" />
        <meta name="application-name" content="MY EYES" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
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
        <AuthProvider>
          <RealtimeSyncProvider>
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>
            {/* Manages .has-bottom-nav and .standalone-mode on body strictly in standalone mode */}
            <StandaloneBodyManager />
            <AnnouncementBanner />
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <PWAInstallBanner />
            {/* MobileBottomNav renders fixed on mobile viewports */}
            <MobileBottomNav />
          </RealtimeSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
