# Instructions for coding agents

This repository is specification-first. Treat the documents and machine-readable catalog as product requirements, not suggestions.

## Mission

Build a calm, offline-first, privacy-preserving mobile learning game for ages roughly 30–72 months. Optimize for specific skill practice, co-play and real-world transfer. Never claim to raise IQ or diagnose development.

## Non-negotiable constraints

1. Do not add accounts, cloud sync, ads, attribution, third-party analytics, push notifications, social features, external links in child mode, camera, microphone, contacts, photos or location.
2. Do not transmit child progress or device identifiers.
3. Do not add Firebase, Sentry, Amplitude, Mixpanel, AppsFlyer, Adjust, AdMob or similar SDKs.
4. Do not create streaks, infinite feeds, loot, lives, leaderboards, scarcity, autoplay loops or variable-ratio rewards.
5. Child gameplay must work fully in airplane mode with all required assets bundled or explicitly installed locally.
6. Parent settings and outbound links require a parental gate.
7. Never require reading in the child flow. Pair concise Romanian audio with visual demonstrations.
8. Open-ended and hybrid games are not scored.
9. Difficulty changes one major axis at a time.
10. Distress or a session limit ends play without penalty.

## Source of truth

- `content/game-catalog.json`: game families and guardrails.
- `content/archetype-presets.json`: initial age-band ranges.
- `content/level-ladders.json`: generated one-axis progression anchors; regenerate, do not hand-edit.
- `schemas/`: content and local-data contracts.
- `docs/04-level-and-adaptation.md`: mastery and scheduler behavior.
- `docs/05-architecture.md`: module boundaries.
- `docs/06-child-ux-design-system.md`: child UX and motion.
- `docs/08-safety-privacy-compliance.md`: privacy and store constraints.
- `docs/12-roadmap.md`: canonical V2 status, priorities and acceptance gates.
- `docs/decisions/2026-07-27-v2-runtime-reboot.md`: audio/offline runtime decision.
- `tasks/`: bounded implementation assignments and acceptance gates.

When documents conflict, safety/privacy wins, then `AGENTS.md`, then schemas/catalog, then the canonical roadmap, then implementation notes.

## Implementation stack

The product is web/PWA-first. The canonical stack and delivery order are in
`docs/12-roadmap.md` and the decision records.

- TypeScript 7 native, pinned at the workspace root, strict mode.
- React for the application shell, parent mode and semantic UI.
- PixiJS 8 with the production WebGL renderer for interactive game scenes.
- DOM accessibility overlays for every actionable canvas object.
- IndexedDB with versioned migrations for local persistence.
- Bundled Romanian recordings decoded through Web Audio.
- Separate voice and SFX buses; SFX duck while speech is active.
- Generated, revisioned service-worker precaching.
- Vitest/property tests and committed Playwright tests.
- Static deployment through Cloudflare Tunnel + Caddy; Cloudflare Pages remains
  an optional managed target. No runtime backend.

Do not add a second native application until the V2 PWA passes offline,
product and device gates. A future Capacitor/TWA wrapper may package the same
web build, but must not duplicate logic or add permissions.

## Architecture rules

- `@little-logic-lab/core` stays pure TypeScript and platform-independent.
- Game logic is deterministic from `seed + difficulty + contentPack`.
- Renderers never decide correctness or mastery.
- Persistence adapters never contain pedagogical decisions.
- Each game plugin implements generate, initialize, reduce, evaluate and getHint. Reuse the pure reference runtimes in `packages/core/src/runtime/` before inventing new behavior.
- Every generated level must be replayable from its seed.
- Each major game mechanic needs unit tests and a solvability/property test.
- Do not reintroduce `new Audio()` for child-facing speech.
- Do not advance input or transitions before active speech finishes.
- Do not restore procedural oscillator voices for animals or objects.

## Current delivery order

The active implementation is `agent/v2-runtime-reboot`. Before visual expansion:

1. compare the branch base with the current `main` HEAD;
2. make `check:v2-runtime`, tests, typecheck and build green;
3. verify a complete golden-slice session in airplane mode;
4. close timeline and lifecycle issues across all arhetipuri;
5. finish and observe `same-picture`, `sort-by-color`, `inset-puzzle`;
6. replace the reviewed golden-slice voice pack through the offline Higgs pipeline;
7. expand other games only after golden-slice gates pass.

Canonical status and acceptance criteria are in `docs/12-roadmap.md`.

## Quality gate

Before any release candidate:

```bash
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Then verify on small and large iOS/Android screens, VoiceOver/TalkBack, Reduce Motion, audio off, airplane mode and after local-data deletion.

Do not silently weaken requirements to make implementation easier. Document tradeoffs in `docs/decisions/`.
