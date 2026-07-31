import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite o webServer do Playwright (localhost / 127.0.0.1 em porta dedicada).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
