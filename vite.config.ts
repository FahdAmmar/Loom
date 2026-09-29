/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // `.kilo/worktrees/` holds a duplicate checkout of this repo. Without
    // this, vitest collects a second, stale copy of every test file and
    // roughly doubles the reported failure count.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.kilo/**"],
  },
});
