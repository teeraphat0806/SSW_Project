import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ✅ ข้าม ESLint ตอน deploy
  },
};

export default nextConfig;
