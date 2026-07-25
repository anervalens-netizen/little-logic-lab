import { defineConfig } from "vite";

export default defineConfig({
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
