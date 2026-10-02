/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a new build waits until the person accepts it (see UpdatePrompt),
      // so an in-progress edit is never interrupted by a reload.
      registerType: "prompt",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Loom",
        short_name: "Loom",
        description: "A calm knowledge workspace weaving pages into a living graph of ideas.",
        start_url: "/",
        display: "standalone",
        background_color: "#f5f3ee",
        theme_color: "#187e5e",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
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
