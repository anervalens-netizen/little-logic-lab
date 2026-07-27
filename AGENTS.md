# Instructions for coding agents

This repository is specification-first. Treat documents and machine-readable
catalogs as product requirements, not suggestions.

## Mission

Build a calm, offline-first, privacy-preserving mobile learning game for ages
roughly 30–72 months. Optimize for specific skill practice, co-play and real-world
transfer. Never claim to raise IQ or diagnose development.

## Non-negotiable constraints

1. Do not add accounts, cloud sync, ads, attribution, third-party analytics, push,
   social features, external links in Child Mode, camera, microphone, contacts,
   photos or location.
2. Do not transmit child progress or device identifiers.
3. Do not add Firebase, Sentry, Amplitude, Mixpanel, AppsFlyer, Adjust, AdMob or
   similar SDKs.
4. Do not create streaks, infinite feeds, loot, lives, leaderboards, scarcity,
   autoplay loops or variable-ratio rewards.
5. Child gameplay must work fully in airplane mode with all required assets local.
6. Parent settings and outbound links require a parental gate.
7. Never require reading in the child flow. Pair concise Romanian audio with
   visual demonstrations.
8. Open-ended and hybrid games are not scored.
9. Difficulty changes one major axis at a time.
10. Distress or a session limit ends play without penalty.

## V2 source order

For `agent/v2-runtime-reboot`, read in this order:

1. `docs/13-v2-independent-audit.md`;
2. `docs/12-roadmap.md`;
3. `tasks/20-v2-server-handoff.md`;
4. `docs/decisions/2026-07-27-v2-runtime-reboot.md`.

The branch is NO-GO for merge/release until executable and physical-device gates
pass.

## General source of truth

- `content/game-catalog.json`: game families and guardrails;
- `content/archetype-presets.json`: age-band ranges;
- `content/level-ladders.json`: generated one-axis progression anchors;
- `schemas/`: content and local-data contracts;
- `docs/04-level-and-adaptation.md`: mastery and scheduler behavior;
- `docs/05-architecture.md`: module boundaries;
- `docs/06-child-ux-design-system.md`: child UX and motion;
- `docs/08-safety-privacy-compliance.md`: privacy and store constraints;
- `docs/12-roadmap.md`: canonical V2 delivery order;
- `docs/13-v2-independent-audit.md`: verified findings and remaining gates.

When documents conflict: safety/privacy, then `AGENTS.md`, schemas/catalog,
canonical roadmap, implementation notes.

## Implementation stack

- TypeScript 7 native, strict;
- React for shell, Home, Parent Mode and semantic UI;
- PixiJS 8/WebGL for interactive scenes;
- DOM accessibility overlay for every actionable canvas object;
- IndexedDB with versioned migrations;
- bundled Romanian recordings decoded through Web Audio;
- separate voice/SFX buses and speech ducking;
- bounded decoded-audio cache and bounded preload concurrency;
- generated, revisioned service-worker precaching;
- property/core tests, Playwright and Axe;
- static Cloudflare Tunnel + Caddy deployment; no runtime backend.

Do not add a second native application until the V2 PWA passes offline, product
and device gates. A future Capacitor/TWA wrapper packages the same build and does
not duplicate logic or add permissions.

## Architecture rules

- `@little-logic-lab/core` stays pure and platform-independent;
- game logic is deterministic from seed, difficulty and content pack;
- renderers never decide correctness or mastery;
- persistence adapters contain no pedagogical decisions;
- every generated level remains replayable;
- every major mechanic needs unit/property tests;
- all timers, listeners, audio nodes and ticker callbacks need idempotent cleanup;
- do not reintroduce `new Audio()` for child speech;
- do not restore procedural oscillator voices for objects;
- do not remove current-release identity checks or Workbox-key lookup;
- do not make offline readiness fail-open;
- do not remove `inert` during blocking narration;
- use `blockInput: false` only when input during speech is the evaluated behavior;
- feedback cannot advance before blocking speech finishes;
- PWA updates activate only at safe session boundaries.

## Current delivery order

1. compare branch base with current `main` HEAD;
2. make static checks, speech audit, tests, typecheck and build green;
3. verify clean install and update over an older release;
4. verify a complete golden-slice session in airplane mode;
5. profile audio memory and cleanup on Android;
6. finish and observe `same-picture`, `sort-by-color`, `inset-puzzle`;
7. replace the reviewed golden-slice voice pack through the offline Higgs pipeline;
8. expand other games only after golden-slice gates pass.

## Quality gate

```bash
npm install
npm run check:v2-runtime
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Then verify on physical targets: update, airplane mode, suspend/resume,
VoiceOver/TalkBack, Reduce Motion, audio off, memory after 30 clips, local-data
delete/export and zero residual resources after five cycles.

Do not silently weaken requirements to make implementation easier. Record changed
technical decisions in `docs/decisions/`.
