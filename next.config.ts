import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Optimize for Docker deployment (reduces size by 80%+)
};

export default nextConfig;
