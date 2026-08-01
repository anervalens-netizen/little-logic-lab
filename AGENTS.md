# Instructions for coding agents

This repository is specification-first. Treat the documents and machine-readable catalog as product requirements, not suggestions.

## Mission

Build a calm, offline-first, privacy-preserving mobile learning game for ages roughly 30–72 months. Optimize for specific skill practice, co-play and real-world transfer. Never claim to raise IQ or diagnose development.

## Non-negotiable constraints

1. Do not add accounts, cloud sync, ads, attribution, third-party analytics, push notifications, social features, external links in child mode, camera, microphone, contacts, photos or location.
2. Do not transmit child progress or device identifiers.
3. Do not add Firebase, Sentry, Amplitude, Mixpanel, AppsFlyer, Adjust, AdMob or similar SDKs.
4. Do not create streaks, infinite feeds, loot, lives, leaderboards, scarcity, autoplay loops or variable-ratio rewards.
5. Child gameplay must work fully in airplane mode with all assets bundled.
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
- `tasks/`: bounded implementation assignments and acceptance gates.

When documents conflict, safety/privacy wins, then `AGENTS.md`, then schemas/catalog, then implementation notes.

## Implementation stack

The product is web/PWA-first. The canonical stack and delivery order are in
`docs/12-roadmap.md` and ADR 005.

- TypeScript 7 native, pinned at the workspace root, strict mode.
- React for the application shell, parent mode and semantic UI.
- PixiJS 8 with the production WebGL renderer for interactive game scenes.
- DOM accessibility overlays for every actionable canvas object.
- IndexedDB with versioned migrations for local persistence.
- Bundled Romanian recordings and Web Audio for child-facing audio.
- Generated, revisioned service-worker precaching.
- Vitest/property tests and committed Playwright tests.
- Static deployment through Cloudflare Tunnel + Caddy; Cloudflare Pages remains
  an optional managed target. No runtime backend.

Do not add a second native application until the P0 web/PWA release passes its
product and device gates. Record exact dependency versions in ADR 005.

## Architecture rules

- `@little-logic-lab/core` stays pure TypeScript and platform-independent.
- Game logic is deterministic from `seed + difficulty + contentPack`.
- Renderers never decide correctness or mastery.
- Persistence adapters never contain pedagogical decisions.
- Each game plugin implements generate, initialize, reduce, evaluate and getHint. Reuse the pure reference runtimes in `packages/core/src/runtime/` before inventing new behavior.
- Every generated level must be replayable from its seed.
- Each major game mechanic needs unit tests and a solvability/property test.

## Current delivery order

The automated P0 implementation and Android performance gate are complete.
Close the remaining human gates before R4:

1. native Romanian audio review;
2. manual VoiceOver/TalkBack traversal;
3. parent-supervised child observation and remediation;
4. P1 expansion through existing archetypes only after P0 findings are closed.

For the private owner deployment, every implemented game is visible and
selectable from first launch. Age and mastery adapt difficulty and scheduling;
they do not gate access to implemented games.

Canonical status and acceptance criteria are in `docs/12-roadmap.md`.

## Quality gate

Before any release candidate:

```bash
npm test
npm run typecheck
npm run build:web
```

Then verify on small and large iOS/Android screens, VoiceOver/TalkBack, Reduce Motion, audio off, airplane mode and after local-data deletion.

Do not silently weaken requirements to make implementation easier. Document tradeoffs in `docs/decisions/`.
