import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "diskominfo.bulungan.go.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bappeda.bulungan.go.id",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
