import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enable for Docker builds; disable for `next start`
};

export default nextConfig;
