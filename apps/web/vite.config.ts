import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; media-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

type ReleaseIdentity = Readonly<{
  schemaVersion: 1;
  application: "little-logic-lab";
  version: string;
  commit: string;
  tree: string;
  committedAt: string;
  lockfileSha256: string;
  nodeVersion: string;
}>;

const git = (...arguments_: string[]): string =>
  execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();

function releaseIdentityPlugin(): Plugin {
  let identity: ReleaseIdentity | undefined;

  return {
    name: "logic-lab-release-identity",
    apply: "build",
    configResolved() {
      const worktreeStatus = git(
        "status",
        "--porcelain=v1",
        "--untracked-files=normal",
      );
      if (worktreeStatus) {
        throw new Error(
          `Release builds require a clean Git worktree; found:\n${worktreeStatus}`,
        );
      }

      const environmentFiles = [
        ".env",
        ".env.local",
        ".env.production",
        ".env.production.local",
      ].filter((name) => existsSync(new URL(`../../${name}`, import.meta.url)));
      const viteEnvironment = Object.keys(process.env).filter((name) =>
        name.startsWith("VITE_"),
      );
      if (environmentFiles.length > 0 || viteEnvironment.length > 0) {
        throw new Error(
          `Release builds forbid untracked Vite inputs; files=${environmentFiles.join(",") || "none"}, variables=${viteEnvironment.join(",") || "none"}`,
        );
      }

      const packageMetadata = JSON.parse(
        readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
      ) as { version: string };
      const lockfile = readFileSync(
        new URL("../../package-lock.json", import.meta.url),
      );
      identity = {
        schemaVersion: 1,
        application: "little-logic-lab",
        version: packageMetadata.version,
        commit: git("rev-parse", "--verify", "HEAD"),
        tree: git("rev-parse", "HEAD^{tree}"),
        committedAt: git("show", "-s", "--format=%cI", "HEAD"),
        lockfileSha256: createHash("sha256").update(lockfile).digest("hex"),
        nodeVersion: process.versions.node,
      };
    },
    transformIndexHtml() {
      if (!identity) throw new Error("Release identity was not initialized.");
      return [
        {
          tag: "meta",
          attrs: {
            name: "logic-lab-release",
            content: identity.commit,
            "data-source-tree": identity.tree,
          },
          injectTo: "head",
        },
      ];
    },
    generateBundle() {
      if (!identity) throw new Error("Release identity was not initialized.");
      this.emitFile({
        type: "asset",
        fileName: "release.json",
        source: `${JSON.stringify(identity, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [
    releaseIdentityPlugin(),
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
        globPatterns: [
          "**/*.{js,css,html,json,woff2,png,webp,svg,mp3,webmanifest}",
        ],
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
    headers: {
      "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    },
  },
  preview: {
    port: 4173,
    headers: {
      "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    },
  },
});
