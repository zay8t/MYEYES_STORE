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
  metadataBase: new URL("https://www.myeyes.pk"),
  title: {
    default: "My Eyes — Pakistan's First Prescription Based Eyewear Store",
    template: "%s | My Eyes Optical Studio",
  },
  description:
    "Lab-precision prescription eyeglasses and sunglasses with custom SPH, CYL, and PD fitting delivered anywhere in Pakistan. Features live 3D try-on, 60-second style quiz, and transparent lens pricing.",
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
    canonical: "https://www.myeyes.pk",
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
    title: "MyEyes",
  },
  openGraph: {
    title: "My Eyes — Pakistan Prescription Based Eyewear Store",
    description: "Lab-precision prescription glasses & sunglasses delivered across Pakistan.",
    url: "https://www.myeyes.pk",
    siteName: "My Eyes",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon-192x192.png",
        width: 192,
        height: 192,
        alt: "My Eyes Optical Studio Logo",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OpticalStore",
      "@id": "https://www.myeyes.pk/#store",
      name: "My Eyes Optical Studio",
      url: "https://www.myeyes.pk",
      logo: "https://www.myeyes.pk/icon-192x192.png",
      image: "https://www.myeyes.pk/icon-192x192.png",
      description:
        "Custom prescription lenses, frames, and sunglasses fitted to precision optical parameters.",
      areaServed: "PK",
      priceRange: "PKR",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.myeyes.pk/eyeglasses?q={search_term_string}",
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
        "https://www.myeyes.pk/eyeglasses",
        "https://www.myeyes.pk/sunglasses",
        "https://www.myeyes.pk/pricing",
        "https://www.myeyes.pk/quiz",
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
      <head>
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
        <RealtimeSyncProvider>
          {/* Manages .has-bottom-nav and .standalone-mode on body strictly in standalone mode */}
          <StandaloneBodyManager />
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <PWAInstallBanner />
          {/* MobileBottomNav renders fixed on mobile viewports */}
          <MobileBottomNav />
        </RealtimeSyncProvider>
      </body>
    </html>
  );
}
