import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to complete with ESLint warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
