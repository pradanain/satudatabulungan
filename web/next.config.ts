import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
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
};

export default nextConfig;
