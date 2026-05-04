import type { NextConfig } from "next";

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
};

export default nextConfig;
