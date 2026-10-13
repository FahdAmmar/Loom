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
      workbox: {
        // Fonts are cached on first use, so unused unicode-range files are never downloaded.
        runtimeCaching: [
          {
            urlPattern: /\.woff2$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
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
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks cache well across releases and load in parallel.
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            { name: "radix", test: /node_modules[\\/]@radix-ui[\\/]/ },
            { name: "dnd", test: /node_modules[\\/]@dnd-kit[\\/]/ },
          ],
        },
      },
    },
  },
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
