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

export default nextConfig;
