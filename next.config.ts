import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.API_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: backend + "/api/:path*" }];
  },
};
export default nextConfig;
