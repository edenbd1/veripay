import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://veripay-api-production-cf87.up.railway.app/:path*",
      },
    ];
  },
};

export default nextConfig;
