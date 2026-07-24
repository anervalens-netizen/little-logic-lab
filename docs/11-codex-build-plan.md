# Codex implementation plan

## Objective

Turn this specification into a production-quality iOS/Android application without changing its safety, privacy or pedagogical boundaries.

Start with the bounded task files in `tasks/`; they are the executable form of this roadmap.

## Phase 0 — repository hardening

Tasks:

- run current validation/tests;
- select current stable Expo SDK and compatible React Native;
- create ADR with exact versions;
- establish workspace/monorepo;
- configure strict TypeScript, linting and CI;
- add dependency allow/deny checks;
- keep `packages/core` platform-independent.

Exit:

- empty mobile shell builds on iOS and Android;
- no tracking SDK or sensitive permission;
- CI passes.

## Phase 1 — first vertical slice

Implement `same-picture`.

Required flow:

1. parent creates local profile or uses anonymous default;
2. child home shows one large activity;
3. short audio/visual demonstration;
4. deterministic level generated from seed;
5. 2–3 large options;
6. child action enters pure reducer;
7. specific feedback;
8. graded hint after error;
9. mastery update and local event;
10. real-world transfer card;
11. session limit closes child flow.

Exit:

- complete offline flow;
- replay from seed;
- unit/UI tests;
- VoiceOver/TalkBack semantics;
- reduced motion;
- data delete/export.

## Phase 2 — reusable runtime

Implement:

- game plugin registry;
- common state machine;
- content loader and schema validation;
- asset/audio registry;
- session scheduler;
- SQLite repositories and migrations;
- parent settings;
- debug level viewer behind developer flag.

Exit:

- a new game can be added through plugin + catalog entry + assets without modifying session shell.

## Phase 3 — eight implemented archetypes

Use the sample core generators and pure runtime state machines:

1. visual choice;
2. sort;
3. memory sequence;
4. go/no-go;
5. order;
6. pattern;
7. number choice;
8. gentle maze.

For each:

- renderer;
- reducer/evaluator;
- two hints;
- simplification;
- accessibility;
- property tests;
- one P0/P1 game definition.

Exit:

- all eight run in one session and persist progress.

## Phase 4 — P0 starter release

Implement all `implementationPriority: P0` games. Some can share an archetype.

Add:

- Romanian recorded audio;
- parent dashboard;
- hybrid activity;
- calm session ending;
- content QA tooling;
- device matrix tests.

Exit:

- 15 starter games;
- no network;
- observed usability findings resolved;
- parent can understand progress without scores.

## Phase 5 — expansion

- P1: age 3–4 catalog;
- P2: age 4–5;
- P3: age 5–6;
- open-ended creation tools;
- richer hybrid tasks;
- additional licensed themes.

Only expand after P0 demonstrates clear usability.

## Acceptance criteria for every game

- primary goal stated and testable;
- no reading required;
- deterministic generation;
- one correct answer or explicitly open-ended;
- no accidental perceptual shortcut;
- first demonstration under a few seconds;
- large targets and forgiving drag;
- audio-off equivalent;
- reduced-motion path;
- two graded hints;
- one-axis simplification;
- offline transfer prompt;
- no network or child data;
- unit/property/UI tests.

## Recommended Codex kickoff prompt

```text
Read AGENTS.md and docs/00-product-principles.md through docs/11-codex-build-plan.md.
Do not add a backend, accounts, analytics, ads, attribution, push, camera, microphone,
location, external child links, streaks or variable rewards.

Use the current stable Expo SDK compatible with stable React Native New Architecture.
Record exact versions in an ADR. Preserve @little-logic-lab/core as pure TypeScript.

Implement Phase 0 and Phase 1 only: a complete offline vertical slice for same-picture,
including parent gate, local SQLite profile/progress, deterministic generation, Romanian
audio placeholders, accessibility semantics, reduced motion, session cap, data export/delete,
unit tests and an end-to-end test. Do not expand scope until the acceptance criteria pass.
```

## Definition of done

Code is not done because the animation looks polished. It is done when logic, content, accessibility, safety, privacy, persistence, deterministic replay and tests all agree.
