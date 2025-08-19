import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // new URL("https://placehold.co/**"),
      new URL("https://images.pexels.com/**"),
    ],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete
    // even if your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
