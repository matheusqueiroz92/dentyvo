import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.{test,spec}.ts"],
          exclude: ["src/**/*.test.tsx", "e2e/**"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.{test,spec}.tsx"],
          exclude: ["e2e/**"],
        },
      },
    ],
  },
});
