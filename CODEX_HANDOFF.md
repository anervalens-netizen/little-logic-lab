# Codex handoff

## Objective

Implement the mobile product without weakening the research, privacy, accessibility or adaptation contracts already present in this repository.

## Read first

1. `AGENTS.md` — authoritative constraints.
2. `docs/11-codex-build-plan.md` — implementation sequence.
3. `docs/05-architecture.md` and `docs/13-game-archetypes.md` — runtime boundaries.
4. `docs/16-start-plan-30-36-months.md` — initial experience for a 31-month-old child.
5. `tasks/00-bootstrap.md` — first executable task.

## First implementation sequence

```text
tasks/00-bootstrap.md
tasks/01-same-picture-vertical-slice.md
tasks/02-p0-game-pack.md
tasks/03-accessibility-privacy-release.md
```

## Non-negotiable acceptance gate

Before every commit:

```bash
npm test
npm run generate
git diff --exit-code -- content/curriculum-map.json content/level-ladders.json docs/03-game-catalog.md examples/generated-levels.json
```

The app must remain offline-first and child-directed: no account, ads, tracking, third-party analytics, remote content, camera, microphone, location, push notifications or manipulative engagement mechanics. Keep all child progress local and place every adult-only action behind the parent gate.

## Design freedom

Codex may choose visual language, characters, illustration system, animation implementation and audio production, provided it preserves large targets, simple gestures, reduced-motion support, non-color-only cues, calm feedback and the content/plugin contracts.
