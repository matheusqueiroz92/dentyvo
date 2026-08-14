import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite o webServer do Playwright (localhost / 127.0.0.1 em porta dedicada).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  transpilePackages: ["swagger-ui-react"],
  serverExternalPackages: ["next-swagger-doc", "swagger-jsdoc"],
};

export default nextConfig;
