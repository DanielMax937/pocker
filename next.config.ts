import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to complete with ESLint warnings
    ignoreDuringBuilds: true,
  },
  // Dev: allow /_next/* when opening the app via LAN IP (e.g. http://192.168.x.x:3040).
  // Wildcards follow Next.js CSRF matcher (private IPv4 ranges).
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
};

export default nextConfig;
