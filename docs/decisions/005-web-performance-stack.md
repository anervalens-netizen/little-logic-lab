# ADR 005 — Web performance stack

Status: accepted

Date: 25 July 2026

## Context

The existing PWA proves the product flow but uses imperative DOM scenes,
hand-written CSS animation and disconnected content ladders. The product needs
repeatable 60 FPS interaction, a scalable renderer for 19 archetypes, strong
semantic UI, local-only storage and reliable offline updates.

## Decision

- TypeScript `7.0.2`, native compiler, strict and pinned at the workspace root.
- React `19.2.x` for the application shell, parent mode and semantic controls.
- PixiJS `8.x` with WebGL for production game scenes.
- Vite `8.1.x` for builds.
- IndexedDB with versioned repositories and migrations.
- Bundled Romanian recordings and Web Audio.
- Revisioned PWA precaching generated from the production build.
- Node/Vitest/property tests plus committed Playwright tests.
- Cloudflare Pages static delivery at `logic-lab.astancu.eu`.

Exact React/Pixi/storage/PWA testing packages will be locked during R1 after a
small compatibility and lifecycle spike. Major versions above are product
constraints; patch versions follow verified upgrades.

## Why

TypeScript 7 is the native Go port released in July 2026. PixiJS provides a
GPU renderer without replacing the deterministic game logic already present in
`@little-logic-lab/core`. React remains outside gameplay rendering and supplies
the semantic shell and accessibility surfaces.

Phaser is not selected because its game/state layer would overlap with the
existing core. WebGPU is not a v1 requirement; WebGL is the production path.

## Consequences

- the current DOM games migrate incrementally through a golden slice;
- canvas actions require synchronized DOM accessibility overlays;
- assets are bundled and licensed; child mode has no remote fetches;
- replay requires seed, ladder stage and content version in local events;
- native iOS/Android work is deferred until the P0 PWA passes device gates.
