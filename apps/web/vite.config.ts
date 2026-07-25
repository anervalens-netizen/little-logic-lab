import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/icon-180.png"],
      manifest: {
        name: "Minte în joacă",
        short_name: "Minte în joacă",
        description:
          "Jocuri logice blânde pentru copii mici. Offline, fără reclame, fără cont.",
        lang: "ro",
        start_url: "/",
        scope: "/",
        display: "fullscreen",
        orientation: "any",
        background_color: "#FFF6E3",
        theme_color: "#FFF6E3",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webmanifest}"],
        globIgnores: ["icons/**/*", "manifest.webmanifest"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      // Pure TypeScript core from the monorepo (no UI dependencies inside).
      "@core": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
    },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
});
