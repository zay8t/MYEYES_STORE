// @ts-check
import withPWAInit from "@ducanh2912/next-pwa";

// ---------------------------------------------------------------------------
// Workbox Runtime Caching Strategy
//
// NEVER CACHE (NetworkOnly):
//   - /api/checkout      — order creation, Stripe, Prisma transaction
//   - /api/orders/*      — order reads/updates
//   - /api/upload        — prescription / image uploads to Cloudinary
//   - /api/payments/*    — payment verification
//   - /api/admin/*       — admin CRUD (except product GET handled below)
//   - Any POST/PUT/PATCH/DELETE (handled by Workbox's default method exclusion)
//
// NetworkFirst (short cache, 60 s):
//   - /api/admin/products* — product catalogue; fresh network preferred,
//     cache used only when network fails. Max age 60 s prevents stale data.
//
// StaleWhileRevalidate (7 days):
//   - res.cloudinary.com  — product images; CDN URLs change when images change,
//     so caching is safe for performance.
//
// CacheFirst (implicit via next-pwa):
//   - /_next/static/*     — hashed JS/CSS bundles (safe, versioned by Next.js)
// ---------------------------------------------------------------------------

const withPWA = withPWAInit({
  dest: "public",               // Service worker output: public/sw.js
  customWorkerDir: "worker",    // Injects worker/index.ts into sw.js
  register: true,               // Auto-register SW from layout
  skipWaiting: true,            // Activate new SW immediately on update
  reloadOnOnline: true,         // Reload page when network returns
  disable: process.env.NODE_ENV === "development", // No SW in dev mode
  workboxOptions: {
    // ── Sensitive / dynamic routes: never cache (NetworkOnly) ────────────
    runtimeCaching: [
      {
        // All API endpoints (products, orders, checkout, payments, etc.) — NetworkOnly (NEVER cache)
        urlPattern: /^\/api\/.*/,
        handler: "NetworkOnly",
      },
      {
        // Cloudinary product images — StaleWhileRevalidate, 7 days
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "myeyes-cloudinary-images",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 7,  // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  reactStrictMode: true,
  compress: true,
  typescript: {
    // Local type-checks handle validation; skips heavy memory consumption during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint fork during build to conserve RAM
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Single process build to avoid worker fork memory spikes
    cpus: 1,
    workerThreads: false,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    unoptimized: true, // Cloudinary CDN handles compression/resizing; avoids server-side buffer allocs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // API rewrites: proxies /api/* to NEXT_PUBLIC_API_URL when set (for external backend).
  // In the standard monolithic Next.js deployment, all /api/* routes are handled
  // by the built-in Route Handlers in src/app/api/ — no rewrite needed.
  // Uncomment the block below ONLY if you split the backend to a separate Render service.
  //
  // async rewrites() {
  //   const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  //   if (!backendUrl) return [];
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${backendUrl}/api/:path*`,
  //     },
  //   ];
  // },
};

export default withPWA(nextConfig);

