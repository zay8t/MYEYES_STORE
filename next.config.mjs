/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: Do NOT set output: "standalone" for Vercel deployments.
  // Vercel manages its own output format. standalone is only for Docker/self-hosted.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
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
    unoptimized: true, // Guarantees zero unconfigured host crashes
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
